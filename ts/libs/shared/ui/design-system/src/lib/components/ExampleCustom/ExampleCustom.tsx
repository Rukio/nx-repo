import { Typography, CardContent, Card, Button } from '../..';

type Props = {
  title: string;
  subtitle: string;
  subtitle2: string;
  href: string;
};

const ExampleCustom = ({ title, subtitle, subtitle2, href }: Props) => (
  <Card
    sx={{
      minWidth: 275,
      maxWidth: 300,
      height: 200,
      position: 'relative',
    }}
  >
    <CardContent>
      <Typography variant="h5" component="h2" align="center" gutterBottom>
        {title}
      </Typography>

      <Typography variant="body2" component="p" align="center">
        {subtitle}
      </Typography>

      <Typography variant="body2" component="p" align="center">
        {subtitle2}
      </Typography>
    </CardContent>

    <Button
      variant="contained"
      href={href}
      sx={{
        position: 'absolute',
        bottom: 0,
        width: '100%',
        justifyContent: 'center',
        borderRadius: 0,
      }}
    >
      edit
    </Button>
  </Card>
);

export default ExampleCustom;
