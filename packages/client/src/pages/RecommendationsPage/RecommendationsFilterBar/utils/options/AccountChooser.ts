/*
 * © 2021 Thoughtworks, Inc.
 */

import { OptionChooser } from 'common/FilterBar/utils/OptionChooser'
import { DropdownFilterOptions, DropdownOption, FilterOptions } from 'Types'
import { DropdownSelections } from 'common/FilterBar/utils/FiltersUtil'
import {
  ALL_KEY,
  CLOUD_PROVIDER_OPTIONS,
} from '../../../../../common/FilterBar/utils/DropdownConstants'

export class AccountChooser extends OptionChooser {
  constructor(
    selections: DropdownOption[],
    oldSelections: DropdownSelections,
    filterOptions: FilterOptions,
  ) {
    super(
      DropdownFilterOptions.ACCOUNTS,
      filterOptions.accounts,
      selections,
      oldSelections,
      filterOptions,
    )

    this.choosers = {
      [DropdownFilterOptions.CLOUD_PROVIDERS]: () => this.chooseProviders(),
      [DropdownFilterOptions.ACCOUNTS]: () => this.chooseAccounts(),
      [DropdownFilterOptions.REGIONS]: () => this.chooseRegions(),
      [DropdownFilterOptions.RECOMMENDATION_TYPES]: () =>
        this.chooseRecommendationTypes(),
    }
  }

  protected chooseAccounts(): Set<DropdownOption> {
    return new Set(this.selections)
  }

  protected chooseProviders(): Set<DropdownOption> {
    const desiredSelections: Set<DropdownOption> = new Set()
    getCloudProvidersFromAccounts(this.selections).forEach(
      (cloudProviderOption) => desiredSelections.add(cloudProviderOption),
    )
    return desiredSelections
  }

  protected chooseRegions(): Set<DropdownOption> {
    const desiredSelections: Set<DropdownOption> = new Set()
    this.selections.forEach((selection) => {
      if (selection.key !== ALL_KEY) {
        this.filterOptions.regions.forEach((regionOption) => {
          regionOption.cloudProvider === selection.cloudProvider &&
            desiredSelections.add(regionOption)
        })
      }
    })
    return desiredSelections
  }

  protected chooseRecommendationTypes(): Set<DropdownOption> {
    const desiredSelections: Set<DropdownOption> = new Set()
    this.selections.forEach((selection) => {
      if (selection.key !== ALL_KEY) {
        this.filterOptions.recommendationTypes.forEach(
          (recommendationTypes) => {
            recommendationTypes.cloudProvider === selection.cloudProvider &&
              desiredSelections.add(recommendationTypes)
          },
        )
      }
    })
    return desiredSelections
  }
}

function getCloudProvidersFromAccounts(
  accountSelections: DropdownOption[],
): Set<DropdownOption> {
  const cloudProviderSelections: Set<DropdownOption> = new Set<DropdownOption>()
  accountSelections.forEach((selection) => {
    if (selection.key !== ALL_KEY) {
      cloudProviderSelections.add(
        <DropdownOption>(
          CLOUD_PROVIDER_OPTIONS.find(
            (option) => option.key === selection.cloudProvider,
          )
        ),
      )
    }
  })
  return cloudProviderSelections
}