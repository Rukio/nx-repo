import { FC } from 'react';
import {
  AccordionProps,
  Accordion as DSAccordion,
  makeSxStyles,
} from '@*company-data-covered*/design-system';

const styles = makeSxStyles({
  accordion: {
    boxShadow: 'none',
    marginBottom: 1,
    '&.Mui-expanded': {
      margin: '8px 0',
    },
    '& > .Mui-expanded': {
      paddingBottom: 0,
      minHeight: 48,
    },
    '.MuiAccordionSummary-content': {
      margin: '12px 0',
    },
  },
});

export const Accordion: FC<AccordionProps> = (props) => (
  <DSAccordion sx={{ ...styles.accordion, ...props.sx }} {...props} />
);
