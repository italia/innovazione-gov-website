import { graphql, type FragmentOf } from "@graphql/graphql";

export const MeasureFragment = graphql(`
  fragment MeasureFragment on MeasureRecord @_unmask {
    id
    goalAchieved
    totalGoal
    allTitleLocales: _allTitleLocales {
      locale
      value
    }
    allDescriptionLocales: _allDescriptionLocales {
      locale
      value
    }
    allCategoryLocales: _allCategoryLocales {
      locale
      value {
        id
        label
        position
      }
    }
    allBeneficiRaggiuntiLocales: _allBeneficiRaggiuntiLocales {
      locale
      value {
        id
        benefitLabel
      }
    }
  }
`);

export type MeasureFragmentType = FragmentOf<typeof MeasureFragment>;
