package mailer

const processedTemplate = `<!DOCTYPE html>
<html>
  <head>
    <meta content='text/html; charset=UTF-8' http-equiv='Content-Type' />
  </head>
  <body>
    <div style="font-family: 'Arial'; padding-bottom: 1em;">
      <img style="height:20px;" src={{.LogoImageURL}}>
      <h5 style="color: grey;">{{.SendingDate}}</h5>
      <h2>Population Health Processing Report</h2>
    </div>
    <div style="font-family: 'Arial';">
      <table style="font-weight: 400; text-align: Left; border-spacing: 0 10px">
        <tr>
          <td style="width: 220px; color: grey;">ID:</td>
          <td>{{.ID}}</td>
        </tr>
        <tr>
          <td style="width: 220px; color: grey;">File Name:</td>
          <td>{{.FileName}}</td>
        </tr>
        <tr>
          <td style="width: 220px; color: grey;">Folder:</td>
          <td>{{.FolderName}}</td>
        </tr>
        <tr>
          <td style="width: 220px; color: grey;">Status: </td>
          <td><strong style="text-transform:uppercase; color: {{if ne .Status "processed" }}red{{else}}green{{end}}">{{.Status}}</strong></td>
        </tr>
        {{if eq .Status "processed" }}
          <tr>
            <td style="width: 220px; color: grey;">Number of Patients Loaded: </td>
            <td>{{.NumberOfPatientsLoaded}}</td>
          </tr>
          <tr>
            <td style="width: 220px; color: grey;">Number of Patients Updated: </td>
            <td>{{.NumberOfPatientsUpdated}}</td>
          </tr>
          <tr>
            <td style="width: 220px; color: grey;">Number of Patients Deleted: </td>
            <td>{{.NumberOfPatientsDeleted}}</td>
          </tr>
          {{if .TotalNumberOfPatients.Valid }}
            <tr>
              <td style="width: 220px; color: grey;">Total Patients: </td>
              <td>{{.TotalNumberOfPatients.Int32}}</td>
            </tr>
          {{end}}
          {{if .IsBackfill }}
            <tr>
              <td style="width: 220px; color: grey;">Is Backfill:</td>
              <td>TRUE</td>
            </tr>
            <tr>
              <td style="width: 220px; color: grey;">Number of Care Request Partner Associations Created: </td>
              <td>{{.CareRequestPartnerMatches}}</td>
            </tr>
          {{end}}
        {{else}}
          <tr>
            <td style="width: 220px; color: grey; vertical-align: text-top;"><strong>Error(s):</strong></td>
            <td>
              <table style="font-size: smaller; text-align: Left; border-spacing: 0 15px">
                {{range .Errors}}
                  {{ if eq .CodeLevel "file"}}
                    <tr>
                      <td style="color: grey;">Error: </td>
                      {{if ne .ErrorDescription.String ""}}
                        <td>{{.ErrorDescription.String}}</td>
                      {{else}}
                        <td>{{.CodeDescription.String}}</td>
                      {{end}}
                    </tr>
                    <tr>
                     <td style="color: grey;">Number of occurrences: </td>
                     <td>{{.NumberOfOccurrences}}</td>
                    </tr>
                    {{ if ne .Fields.String "" }}
                      <tr>
                        <td style="color: grey;">Fields: </td>
                        <td>{{.Fields.String}}</td>
                      </tr>
                    {{end}}
                    <tr>
                       <td style="border-bottom: 1px solid #D0D5D7;"></td>
                       <td style="border-bottom: 1px solid #D0D5D7;"></td>
                     </tr>
                  {{end}}
                {{end}}
                {{range .Errors}}
                  {{ if eq .CodeLevel "row"}}
                    <tr>
                      <td style="color: grey;">Field: </td>
                      <td>{{.Fields.String}}</td>
                    </tr>
                    <tr>
                      <td style="color: grey;">Error: </td>
                      <td>{{.CodeDescription.String}}</td>
                    </tr>
                    <tr>
                      <td style="color: grey;">Number of occurrences: </td>
                      <td>{{.NumberOfOccurrences}}</td>
                    </tr>
                    <tr>
                      <td style="color: grey;">Row of first occurrence: </td>
                      <td>{{.FirstOccurrence.Int32}}</td>
                    </tr>
                    <tr>
                      <td style="border-bottom: 1px solid #D0D5D7;"></td>
                      <td style="border-bottom: 1px solid #D0D5D7;"></td>
                    </tr>
                  {{end}}
                {{end}}
              </table>
            </td>
          </tr>
        {{end}}
      </table>
    </div>
  </body>
</html>
`
