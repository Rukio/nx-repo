import { FC, ChangeEvent, useMemo } from 'react';
import {
  makeSxStyles,
  Box,
  Typography,
  SearchIcon,
  Grid,
  Modal,
  Button,
  IconButton,
  CloseIcon,
  List,
  ListItem,
  TextField,
  LoadingButton,
} from '@*company-data-covered*/design-system';
import { SELECT_INSURANCE_PROVIDER_MODAL_TEST_IDS } from './testIds';
import { useDebouncedCallback } from '@*company-data-covered*/shared/util/hooks';

export type InsuranceProviderOption = {
  label: string;
  id: string;
};

export type InsuranceProviderOptionsList = {
  character: string;
  options: InsuranceProviderOption[];
};

export type InsuranceNetworkPayer = {
  id: string;
  name: string;
  classificationId?: string;
  classificationName?: string;
  stateAbbrs?: string[];
};

export type SelectInsuranceProviderModalProps = {
  open: boolean;
  insuranceNotInListButtonLabel: string;
  insuranceSearch: string;
  onChangeSearch: (value: string) => void;
  onClose: () => void;
  onChooseInsurance: (id: string) => void;
  onNotOnThisListClick: () => void;
  searchOptions: InsuranceNetworkPayer[];
  isLoading?: boolean;
};

const makeStyles = () =>
  makeSxStyles({
    header: (theme) => ({
      p: 3,
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.palette.common.white,
      borderBottom: `1px solid ${theme.palette.grey['200']}`,
    }),
    insuranceNotListedContainer: (theme) => ({
      backgroundColor: theme.palette.common.white,
      boxShadow: `0px 0px 16px 0px ${theme.palette.action.selected}`,
      borderTop: `1px solid ${theme.palette.grey['200']}`,
    }),
    container: (theme) => ({
      maxHeight: '100%',
      p: 3,
      backgroundColor: theme.palette.background.paper,
      height: { xs: 'calc(100% - 170px)', md: 'calc(100% - 120px)' },
    }),
    modalContent: {
      height: '100%',
      maxWidth: { xs: '100%', md: '800px' },
      maxHeight: { xs: '100%', md: '700px' },
      width: '100%',
    },
    modal: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontWeight: '600',
      py: 0.5,
    },
    option: (theme) => ({
      py: 0.5,
      px: 0,
      justifyContent: 'flex-start',
      color: theme.palette.text.primary,
    }),
    allProvidersTitle: {
      pt: 3,
      pb: 1.5,
    },
    listItem: {
      p: 0,
      width: '100%',
    },
    optionList: {
      flexDirection: 'column',
      width: '100%',
    },
    optionListContainer: {
      overflowY: 'auto',
      maxHeight: 'calc(100% - 30px)',

      '&::-webkit-scrollbar': {
        display: 'none',
      },
      scrollbarWidth: 'none',
      msOverflowStyle: 'none',
    },
    notFoundButton: (theme) => ({
      backgroundColor: theme.palette.common.white,
    }),
  });

const SelectInsuranceProviderModal: FC<SelectInsuranceProviderModalProps> = ({
  open,
  insuranceNotInListButtonLabel,
  insuranceSearch,
  onChangeSearch,
  onClose,
  onChooseInsurance,
  onNotOnThisListClick,
  searchOptions,
  isLoading,
}) => {
  const styles = makeStyles();

  const handleSearchValueChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    onChangeSearch(value);
  };

  const onSearchValueChangeDebounced = useDebouncedCallback(
    handleSearchValueChange
  );

  const payersList = useMemo(() => {
    const payersFiltered = searchOptions.filter((payer) =>
      insuranceSearch
        ? payer.name.toLowerCase().includes(insuranceSearch.toLowerCase())
        : true
    );
    const firstLetters = payersFiltered
      .map((payer) => payer.name.substring(0, 1).toUpperCase())
      .filter((value, i, self) => self.indexOf(value) === i)
      .sort((a, b) => a.localeCompare(b));

    return firstLetters.map((payerLetter) => ({
      character: payerLetter,
      options: searchOptions
        .filter((payer) =>
          payer.name.toLowerCase().startsWith(payerLetter.toLowerCase())
        )
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((payer) => ({ id: payer.id.toString(), label: payer.name })),
    }));
  }, [searchOptions, insuranceSearch]);

  return (
    <Modal
      sx={styles.modal}
      open={open}
      data-testId={SELECT_INSURANCE_PROVIDER_MODAL_TEST_IDS.CONTAINER}
    >
      <Box sx={styles.modalContent}>
        <Box sx={styles.header}>
          <Typography variant="h6">Select Insurance Provider</Typography>
          <IconButton
            onClick={onClose}
            data-testId={
              SELECT_INSURANCE_PROVIDER_MODAL_TEST_IDS.CLOSE_MODAL_ICON
            }
          >
            <CloseIcon />
          </IconButton>
        </Box>
        <Box sx={styles.container}>
          <TextField
            label="Search insurance providers"
            fullWidth
            onChange={onSearchValueChangeDebounced}
            inputProps={{
              'data-testId':
                SELECT_INSURANCE_PROVIDER_MODAL_TEST_IDS.SEARCH_INSURANCE,
            }}
            InputProps={{
              startAdornment: <SearchIcon />,
            }}
          />
          <Grid container sx={styles.optionListContainer}>
            <Typography variant="overline" sx={styles.allProvidersTitle}>
              ALL PROVIDERS
            </Typography>
            {payersList.map((optionGroup) => {
              return (
                <List key={optionGroup.character} sx={styles.optionList}>
                  <Typography
                    sx={styles.title}
                    data-testId={SELECT_INSURANCE_PROVIDER_MODAL_TEST_IDS.getSectionCharacter(
                      optionGroup.character
                    )}
                  >
                    {optionGroup.character}
                  </Typography>
                  {optionGroup.options.map((option) => {
                    const testId =
                      SELECT_INSURANCE_PROVIDER_MODAL_TEST_IDS.getInsuranceOptionId(
                        option.id
                      );

                    const onClickInsurance = () => {
                      onChooseInsurance(option.id);
                    };

                    return (
                      <ListItem sx={styles.listItem} key={option.id}>
                        <Button
                          variant="text"
                          fullWidth
                          sx={styles.option}
                          onClick={onClickInsurance}
                        >
                          <Typography data-testId={testId}>
                            {option.label}
                          </Typography>
                        </Button>
                      </ListItem>
                    );
                  })}
                </List>
              );
            })}
          </Grid>
        </Box>
        <Box sx={styles.insuranceNotListedContainer}>
          <LoadingButton
            variant="text"
            fullWidth
            sx={styles.notFoundButton}
            data-testid={
              SELECT_INSURANCE_PROVIDER_MODAL_TEST_IDS.INSURANCE_NOT_IN_THE_LIST
            }
            onClick={onNotOnThisListClick}
            loading={isLoading}
          >
            {insuranceNotInListButtonLabel}
          </LoadingButton>
        </Box>
      </Box>
    </Modal>
  );
};

export default SelectInsuranceProviderModal;
