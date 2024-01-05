// https://github.com/mui/material-ui/issues/21701#issuecomment-716547855
expect.addSnapshotSerializer({
  test: function (val) {
    return (
      val &&
      typeof val === 'string' &&
      val.indexOf('mui-') >= 0 &&
      /^\d+$/.test(val[4])
    );
  },
  print: function (val) {
    let str = val;
    str = str.replace(/mui-\d*/g, 'mui-0728');

    return `"${str}"`;
  },
});
