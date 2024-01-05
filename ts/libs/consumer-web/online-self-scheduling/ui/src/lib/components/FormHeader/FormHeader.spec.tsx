import { render, screen } from '../../../testUtils';
import FormHeader, { FormHeaderProps } from './FormHeader';
import { FORM_HEADER_TEST_IDS } from './testIds';

const defaultProps: FormHeaderProps = {
  title: 'Title',
};

const setup = (props: Partial<FormHeaderProps> = {}) => {
  const { user, ...wrapper } = render(
    <FormHeader {...defaultProps} {...props} />
  );

  const getHeaderContainer = () =>
    screen.getByTestId(FORM_HEADER_TEST_IDS.CONTAINER);
  const getHeaderTitle = () => screen.getByTestId(FORM_HEADER_TEST_IDS.TITLE);
  const getHeaderSubtitle = () =>
    screen.getByTestId(FORM_HEADER_TEST_IDS.SUBTITLE);
  const getHeaderImage = () => screen.getByTestId(FORM_HEADER_TEST_IDS.IMAGE);

  return {
    user,
    ...wrapper,
    getHeaderContainer,
    getHeaderTitle,
    getHeaderSubtitle,
    getHeaderImage,
  };
};

describe('<FormHeader />', () => {
  it('should render FormHeader with title only', () => {
    const { getHeaderContainer, getHeaderTitle } = setup();

    const container = getHeaderContainer();
    expect(container).toBeVisible();

    const title = getHeaderTitle();
    expect(title).toBeVisible();
    expect(title).toHaveTextContent(defaultProps.title as string);
  });

  it('should render FormHeader with title and subtitle', () => {
    const subtitleText = 'Subtitle';
    const { getHeaderContainer, getHeaderTitle, getHeaderSubtitle } = setup({
      subtitle: subtitleText,
    });

    const container = getHeaderContainer();
    expect(container).toBeVisible();

    const title = getHeaderTitle();
    expect(title).toBeVisible();
    expect(title).toHaveTextContent(defaultProps.title as string);

    const subtitle = getHeaderSubtitle();
    expect(subtitle).toBeVisible();
    expect(subtitle).toHaveTextContent(subtitleText);
  });

  it('should render FormHeader with title, subtitle and image', () => {
    const subtitleText = 'Subtitle';
    const mockImageSrcSet = 'image.png 100w';
    const mockImageSizes = '(min-width: 100px) 100px, 200px';
    const {
      getHeaderContainer,
      getHeaderTitle,
      getHeaderSubtitle,
      getHeaderImage,
    } = setup({
      subtitle: subtitleText,
      imageSrc: 'imageSrc',
      imageSrcSet: mockImageSrcSet,
      imageSizes: mockImageSizes,
    });

    const container = getHeaderContainer();
    expect(container).toBeVisible();

    const title = getHeaderTitle();
    expect(title).toBeVisible();
    expect(title).toHaveTextContent(defaultProps.title as string);

    const subtitle = getHeaderSubtitle();
    expect(subtitle).toBeVisible();
    expect(subtitle).toHaveTextContent(subtitleText);

    const image = getHeaderImage();
    expect(image).toBeVisible();
    expect(image).toHaveAttribute('srcSet', mockImageSrcSet);
    expect(image).toHaveAttribute('sizes', mockImageSizes);
  });
});
