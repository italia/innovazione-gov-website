import { InterviewCardFragment } from "@graphql/fragment/commonFragments";
import { graphql } from "@graphql/graphql";

export const AllInterviewCardQuery = graphql(
  `
    query AllInterview {
      allInterviews(first: 2500) {
        ...InterviewCardFragment
      }
    }
  `,
  [InterviewCardFragment],
);
