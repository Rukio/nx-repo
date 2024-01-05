import { Meta, StoryFn } from '@storybook/react';
import FormHeader from './FormHeader';

const imageSrc =
  'https://assets.*company-data-covered*.com/dims4/default/b5677ef/2147483647/strip/true/crop/2202x1069+0+0/resize/768x373!/quality/90/?url=https%3A%2F%2Fdispatch-health-production-web.s3.amazonaws.com%2Fbrightspot%2F66%2Ff1%2F06e1dcbd4423bc0eb701a7a9aae6%2Fdispatch-health-senior-center-entrance-2194-new-rover-3x.jpg';

export default {
  title: 'FormHeader',
  component: FormHeader,
} as Meta<typeof FormHeader>;

const Template: StoryFn<typeof FormHeader> = (args) => <FormHeader {...args} />;

export const Basic = Template.bind({});
Basic.args = {
  title: 'Lorem Ipsum is simply dummy text',
  subtitle:
    'Lorem Ipsum has been the industry standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.',
  imageSrc: imageSrc,
};

export const TitleOnly = Template.bind({});
TitleOnly.args = {
  title: 'Lorem Ipsum is simply dummy text',
};

export const TitleAndSubtitle = Template.bind({});
TitleAndSubtitle.args = {
  title: 'Lorem Ipsum is simply dummy text',
  subtitle:
    'Lorem Ipsum has been the industry standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.',
};

export const SubtitleAsReactElement = Template.bind({});
SubtitleAsReactElement.args = {
  title: 'Lorem Ipsum is simply dummy text',
  subtitle: (
    <span>
      Lorem Ipsum has been the <b>standard dummy text ever since the 1500s</b>,
      when an unknown printer took a galley of type and scrambled it to make a
      type specimen book.
    </span>
  ),
};
