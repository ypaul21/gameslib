/* eslint-disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

/**
 * Written information about changes in game state after a move are encoded as a JSON object matching this schema. The goal is to then allow localized statements to be generated from them.
 */
export type APMoveResult =
  | {
      type: "_group";
      /**
       * The numeric player id of the player this group belongs to.
       */
      who: number;
      /**
       * @minItems 1
       */
      results: [APMoveResult, ...APMoveResult[]];
    }
  | {
      type: "place";
      where?: string;
      what?: string;
      who?: number;
      count?: number;
    }
  | {
      type: "move";
      from: string;
      to: string;
      what?: string;
      how?: string;
      count?: number;
    }
  | {
      type: "capture";
      where?: string;
      what?: string;
      count?: number;
      whose?: number;
    }
  | {
      type: "take";
      what?: string;
      from: string;
    }
  | {
      type: "pass";
      who?: number;
    }
  | {
      type: "deltaScore";
      delta?: number;
      who?: number;
    }
  | {
      type: "reclaim";
      what?: string;
      where?: string;
      count?: number;
    }
  | {
      type: "block";
      by?: string;
      /**
       * Use this for blocking off a single space
       */
      where?: string;
      /**
       * Use this to block between two spaces
       *
       * @minItems 2
       * @maxItems 2
       */
      between?: [string, string];
    }
  | {
      type: "eog";
      reason?: string;
    }
  | {
      type: "winners";
      players: number[];
    }
  | {
      type: "draw";
    }
  | {
      type: "resigned";
      player: number;
    }
  | {
      type: "timeout";
      player: number;
    }
  | {
      type: "drawagreed";
    }
  | {
      type: "kicked";
      player: number;
    }
  | {
      type: "promote";
      player?: number;
      from?: string;
      to: string;
      where?: string;
    }
  | {
      type: "eliminated";
      who: string;
    }
  | {
      type: "homeworld";
      stars: string[];
      ship: string;
      name: string;
    }
  | {
      type: "discover";
      what?: string;
      where?: string;
      called?: string;
    }
  | {
      type: "convert";
      what: string;
      into: string;
      where?: string;
    }
  | {
      type: "sacrifice";
      what: string;
      where?: string;
    }
  | {
      type: "catastrophe";
      where: string;
      trigger?: string;
    }
  | {
      type: "eject";
      from: string;
      to: string;
      what?: string;
    }
  | {
      type: "orient";
      what?: string;
      where?: string;
      facing: string;
    }
  | {
      type: "detonate";
      what?: string;
      where?: string;
    }
  | {
      type: "destroy";
      what?: string;
      where?: string;
    }
  | {
      type: "bearoff";
      what?: string;
      from: string;
      edge?: string;
    }
  | {
      type: "add";
      where: string;
      num: number;
    }
  | {
      type: "remove";
      where: string;
      num: number;
    }
  | {
      type: "claim";
      where: string;
      who?: number;
      what?: string;
    }
  | {
      type: "nullifyClaim";
      where: string;
    }
  | {
      type: "immobilize";
      where: string;
      what?: string;
    }
  | {
      type: "pull";
      where: string;
    }
  | {
      type: "affiliate";
      which: string;
    }
  | {
      type: "repair";
      what?: string;
      where?: string;
      amount?: number;
    }
  | {
      type: "fire";
      from?: string;
      to?: string;
      which?: string;
    }
  | {
      type: "damage";
      who?: string;
      where?: string;
      amount?: number;
    }
  | {
      type: "declare";
    }
  | {
      type: "infinite";
    }
  | {
      type: "sow";
      pits: string[];
    }
  | {
      type: "select";
      who?: number;
      what?: string;
      where?: string;
    }
  | {
      type: "set";
      count?: number;
      who?: number;
      what?: string;
      where?: string;
    }
  | {
      type: "furl";
      from: string;
      to: string;
      count?: number;
    }
  | {
      type: "unfurl";
      from: string;
      to: string;
      count?: number;
    }
  | {
      type: "roll";
      values: number[];
      who?: number;
    }
  | {
      type: "reset";
    };
