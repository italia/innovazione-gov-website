import { graphql, type FragmentOf } from "@graphql/graphql";

export const TagRecordFragment = graphql(`
  fragment TagRecordFragment on TagRecord @_unmask {
    id
    name
    slug
    description
    isHighlighted
  }
`);

export type TagRecordFragmentType = FragmentOf<typeof TagRecordFragment>;
