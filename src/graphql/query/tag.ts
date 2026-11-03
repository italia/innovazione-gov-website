import { TagRecordFragment } from "@graphql/fragment/tag";
import { graphql } from "@graphql/graphql";

export const AllTagsQuery = graphql(
  `
    query AllTags {
      allTags(orderBy: name_ASC, first: 500) {
        ...TagRecordFragment
      }
    }
  `,
  [TagRecordFragment],
);
