import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PlaceSearch } from "./PlaceSearch";
import { searchPlaces } from "../api/client";
import type { PlaceInfo } from "../api/types";

vi.mock("../api/client", () => ({ searchPlaces: vi.fn() }));

const mockedSearch = vi.mocked(searchPlaces);

function place(name: string): PlaceInfo {
  return { name, country: "France", admin1: null, latitude: 1, longitude: 2 };
}

afterEach(() => {
  vi.resetAllMocks();
});

describe("PlaceSearch", () => {
  it("shows a search icon while empty, and a clear button once there is text", async () => {
    mockedSearch.mockResolvedValue([place("Odesa")]);
    const user = userEvent.setup();
    const { container } = render(<PlaceSearch loading={false} onSelect={vi.fn()} onClear={vi.fn()} />);

    expect(container.querySelector(".pi-search")).not.toBeNull();
    expect(screen.queryByLabelText("Clear search")).toBeNull();

    await user.type(screen.getByRole("combobox", { name: /city or town/i }), "Odesa");

    await waitFor(() => expect(screen.getByLabelText("Clear search")).toBeInTheDocument());
    expect(container.querySelector(".pi-search")).toBeNull();
  });

  it("hides the clear button while the app is loading a forecast", () => {
    render(<PlaceSearch loading={true} onSelect={vi.fn()} onClear={vi.fn()} />);
    expect(screen.queryByLabelText("Clear search")).toBeNull();
  });

  it("clearing empties the field, returns focus, and tells the parent", async () => {
    mockedSearch.mockResolvedValue([place("Odesa")]);
    const onClear = vi.fn();
    const user = userEvent.setup();
    render(<PlaceSearch loading={false} onSelect={vi.fn()} onClear={onClear} />);

    const input = screen.getByRole("combobox", { name: /city or town/i });
    await user.type(input, "Odesa");
    await waitFor(() => expect(screen.getByLabelText("Clear search")).toBeInTheDocument());

    await user.click(screen.getByLabelText("Clear search"));

    expect((input as HTMLInputElement).value).toBe("");
    expect(document.activeElement).toBe(input);
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(screen.queryByLabelText("Clear search")).toBeNull();
  });

  it("keeps the newest results when two lookups finish out of order", async () => {
    // "od" is started first but answers last. Its result must be dropped,
    // otherwise the list would disagree with the text in the box.
    let resolveFirst!: (v: PlaceInfo[]) => void;
    let resolveSecond!: (v: PlaceInfo[]) => void;
    mockedSearch
      .mockImplementationOnce(() => new Promise((r) => (resolveFirst = r)))
      .mockImplementationOnce(() => new Promise((r) => (resolveSecond = r)));

    const user = userEvent.setup();
    render(<PlaceSearch loading={false} onSelect={vi.fn()} onClear={vi.fn()} />);
    const input = screen.getByRole("combobox", { name: /city or town/i });

    await user.type(input, "od");
    await waitFor(() => expect(mockedSearch).toHaveBeenCalledTimes(1));
    await user.type(input, "es");
    await waitFor(() => expect(mockedSearch).toHaveBeenCalledTimes(2));

    resolveSecond([place("Odesa")]);
    await screen.findByRole("option", { name: /Odesa/, hidden: true });

    resolveFirst([place("Stale Oddball")]);
    await waitFor(() => expect(screen.queryByText(/Stale Oddball/)).toBeNull());
    expect(screen.getByRole("option", { name: /Odesa/, hidden: true })).toBeInTheDocument();
  });

  it("drops a lookup that answers after the field was cleared", async () => {
    let resolveSlow!: (v: PlaceInfo[]) => void;
    mockedSearch.mockImplementationOnce(() => new Promise((r) => (resolveSlow = r)));

    const user = userEvent.setup();
    render(<PlaceSearch loading={false} onSelect={vi.fn()} onClear={vi.fn()} />);
    const input = screen.getByRole("combobox", { name: /city or town/i });

    await user.type(input, "od");
    await waitFor(() => expect(mockedSearch).toHaveBeenCalledTimes(1));

    // The lookup is still running, so the spinner owns the icon slot and the
    // clear button is hidden. Clear through the same path the button uses.
    resolveSlow([place("Odesa")]);
    await waitFor(() => expect(screen.getByLabelText("Clear search")).toBeInTheDocument());
    await user.click(screen.getByLabelText("Clear search"));

    expect((input as HTMLInputElement).value).toBe("");
    expect(screen.queryByRole("option", { hidden: true })).toBeNull();
  });
});
