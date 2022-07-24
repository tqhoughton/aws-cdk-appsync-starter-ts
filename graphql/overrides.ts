import { Menu, MenuItem, Section } from "./private/types.generated";

type _MenuItem = Pick<MenuItem, "id" | "__typename">;

export type ResolvedSection = Omit<Section, "menuItems"> & {
  menuItems: Array<_MenuItem>;
};

export type ResolvedMenu = Omit<Menu, "section"> & {
  sections: Array<ResolvedSection>;
};
