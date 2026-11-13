/** The Tools the Screens use; every value must exist in `serving/tools/public` (the contract audit proves it). Bare names (the Gateway prefix is not used by the Console). */
export enum MetodikaTool {
  Search = 'search',
  Lookup = 'lookup',
  Doc = 'doc',
  Status = 'status',
}

/** Tool -> the (snake case) input keys its facade method may send; mirrors the `parameters` of the Tool JSON. */
export const TOOL_INPUT_KEYS: Readonly<Record<MetodikaTool, readonly string[]>> = {
  [MetodikaTool.Search]: ['query', 'k', 'mode', 'fonte', 'section', 'tipo', 'ente', 'anno_from', 'anno_to', 'data_from', 'data_to'],
  [MetodikaTool.Lookup]: ['fonte', 'section', 'tipo', 'numero', 'anno', 'data_from', 'data_to', 'ente', 'sort', 'limit', 'offset'],
  [MetodikaTool.Doc]: ['id', 'fonte', 'source_id', 'tipo', 'numero', 'anno', 'offset', 'length'],
  [MetodikaTool.Status]: [],
};
