import {
  FocusCardFragment,
  ParticipationCardFragment,
  PressReleaseCardFragment,
} from "@graphql/fragment/commonFragments";
import { graphql } from "@graphql/graphql";

export const AllParticipationCardQuery = graphql(
  `
    query AllParticipation {
      allParticipations(first: 2500) {
        ...ParticipationCardFragment
      }
    }
  `,
  [ParticipationCardFragment],
);

export const AllPressReleaseCardQuery = graphql(
  `
    query AllPressRelease {
      allPressReleases(first: 2500) {
        ...PressReleaseCardFragment
      }
    }
  `,
  [PressReleaseCardFragment],
);

export const AllFocusCardQuery = graphql(
  `
    query AllFocus {
      allFocusPages(first: 2500) {
        ...FocusCardFragment
      }
    }
  `,
  [FocusCardFragment],
);
