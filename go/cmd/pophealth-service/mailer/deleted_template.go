package mailer

const deletedTemplate = `<!DOCTYPE html>
<html>
  <head>
    <meta content='text/html; charset=UTF-8' http-equiv='Content-Type' />
  </head>
  <body>
    <div style="font-family: 'Arial'; padding-bottom: 1em;">
      <img style="height:20px;" src={{.LogoImageURL}}>
      <h5 style="color: grey;">{{.SendingDate}}</h5>
      <h2>Population Health Deactivation Report</h2>
    </div>
    <div style="font-family: 'Arial';">
      {{ if .IsSuccess }}
        Pop health folder {{.FolderName}} with template(s) {{.TemplateNames}} has been successfully deactivated and all
        patient records have been deleted.
      {{ else }}
        <p>Pop health folder {{.FolderName}} could not be deactivated.</p>
        <p>Error: {{.ErrorMessage}}</p>
      {{ end }}
    </div>
  </body>
</html>
`
