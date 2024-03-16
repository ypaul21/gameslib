/* eslint-disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

/**
 * List of URLs related to the game
 */
export type Urllist = string[];
/**
 * List of URLs associated with this person or organization
 */
export type Urllist1 = string[];

/**
 * When requested, the games library will produce the following information about requested games
 */
export interface APGamesInformation {
  /**
   * The name of the game
   */
  name: string;
  /**
   * The unique code by which this game is referred to by the system. It's typically lowercase and devoid of whitespace and special characters. It should mirror the game name as much as possible.
   */
  uid: string;
  /**
   * A Markdown-formatted description of the game, which can include a rules summary
   */
  description?: string;
  /**
   * Markdown-formatted implementation notes. There is where we can explain implementation-specific details about how the game works on Abstract Play specifically. This should help keep the game descriptions clean.
   */
  notes?: string;
  urls?: Urllist;
  /**
   * A string representing the version of the current implementation. The format of the string is irrelevant. Its main purpose is to identify incompatible game state representations. It should be changed whenever the internal game rep changes.
   */
  version: string;
  /**
   * The date the game was pushed to production, in ISO year-month-day order.
   */
  dateAdded: string;
  /**
   * The people and organizations involved in the game's creation
   */
  people?: Person[];
  /**
   * A list of supported variants
   */
  variants?: Variant[];
  /**
   * A list of alternative displays/renderers
   */
  displays?: AlternativeDisplay[];
  /**
   * A list of the supported player counts
   */
  playercounts: number[];
  /**
   * A list categories. The list should not contain any duplicates. Nesting is accomplished by joining the names of levels with the greater-than symbol (>). Names should not contain spaces. Translation into proper labels is left to the client.
   *
   * @minItems 1
   */
  categories: [string, ...string[]];
  /**
   * A list of flags used by the front end to signal the presence or absence of a particular feature.
   */
  flags?: (
    | "aiai"
    | "automove"
    | "check"
    | "custom-colours"
    | "custom-randomization"
    | "experimental"
    | "limited-pieces"
    | "multistep"
    | "no-explore"
    | "no-moves"
    | "perspective"
    | "pie-even"
    | "pie"
    | "player-stashes"
    | "random-start"
    | "rotate90"
    | "scores"
    | "shared-pieces"
    | "shared-stash"
    | "simultaneous"
    | "stacking-expanding"
  )[];
  [k: string]: unknown;
}
export interface Person {
  /**
   * A description of the type of involvement this person has with the game
   */
  type?: "designer" | "publisher" | "coder" | "other";
  /**
   * The person or organization name
   */
  name: string;
  urls?: Urllist1;
  [k: string]: unknown;
}
export interface Variant {
  /**
   * The name of the variant. These are looked up from apgames.json by the allvariants() function
   */
  name?: string;
  /**
   * A short, unique string representing this variant
   */
  uid: string;
  /**
   * A description of the variant. These are looked up from apgames.json by the allvariants() function
   */
  description?: string;
  /**
   * If present, variants of the same `group` are considered mutually exclusive
   */
  group?: string;
  [k: string]: unknown;
}
export interface AlternativeDisplay {
  /**
   * The name of the alternative display. These are looked up from apgames.json by the alternativeDisplays() function
   */
  name?: string;
  /**
   * A short, unique string representing this alternative display
   */
  uid: string;
  /**
   * A description of the alternative display. These are looked up from apgames.json by the alternativeDisplays() function
   */
  description?: string;
  [k: string]: unknown;
}
