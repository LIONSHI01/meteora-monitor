import { PositionInfo } from "@meteora-ag/dlmm";

export const verifyLPWithinRange = () => {};

export const convertPositionMapToArray = (
  positionsMap: Map<string, PositionInfo>
) => {
  return Array.from(positionsMap, ([name, value]) => ({
    positionAddress: name,
    position: value,
  }));
};
