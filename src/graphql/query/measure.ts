import { MeasureFragment } from "@graphql/fragment/measure";
import { graphql } from "@graphql/graphql";

export const AllMeasuresQuery = graphql(
  `
    query AllMeasures {
      allMeasures(first: 2500) {
        ...MeasureFragment
      }
    }
  `,
  [MeasureFragment],
);
