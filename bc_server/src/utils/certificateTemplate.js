export const getCertificateHTML = ({
  name,
  readingScore,
  listeningScore,
  issueDate,
  expirationDate,
  nationalID,
}) => {
  const totalScore = Number(readingScore) + Number(listeningScore);
  const formattedIssueDate = new Date(Number(issueDate)).toLocaleDateString(
    "vi-VN",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );
  const formattedExpirationDate = new Date(
    Number(expirationDate)
  ).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>TOEIC Certificate</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
        
        body {
          margin: 0;
          padding: 0;
          width: 1200px;
          height: 800px;
          font-family: 'Roboto', sans-serif;
          background: #ffffff;
          position: relative;
          overflow: hidden;
        }
        .certificate {
          width: 100%;
          height: 100%;
          padding: 40px;
          box-sizing: border-box;
          position: relative;
          background: linear-gradient(45deg, #f3f4f6 25%, transparent 25%),
                      linear-gradient(-45deg, #f3f4f6 25%, transparent 25%),
                      linear-gradient(45deg, transparent 75%, #f3f4f6 75%),
                      linear-gradient(-45deg, transparent 75%, #f3f4f6 75%);
          background-size: 20px 20px;
          background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
        }
        .header h1 {
          color: #1a56db;
          font-size: 36px;
          margin: 0;
          font-weight: 700;
        }
        .header p {
          color: #4b5563;
          font-size: 18px;
          margin: 10px 0 0;
        }
        .content {
          text-align: center;
          margin-bottom: 40px;
        }
        .name {
          font-size: 32px;
          color: #111827;
          margin: 20px 0;
          font-weight: 700;
        }
        .score {
          font-size: 48px;
          color: #1a56db;
          margin: 30px 0;
          font-weight: 700;
        }
        .details {
          display: flex;
          justify-content: space-around;
          margin: 40px 0;
          font-size: 16px;
          color: #4b5563;
        }
        .detail-item {
          text-align: center;
        }
        .detail-item strong {
          display: block;
          color: #111827;
          margin-bottom: 5px;
        }
        .footer {
          position: absolute;
          bottom: 40px;
          left: 0;
          right: 0;
          text-align: center;
          font-size: 14px;
          color: #6b7280;
        }
        .border {
          position: absolute;
          top: 20px;
          left: 20px;
          right: 20px;
          bottom: 20px;
          border: 2px solid #1a56db;
          pointer-events: none;
        }
      </style>
    </head>
    <body>
      <div class="certificate">
        <div class="border"></div>
        <div class="header">
          <h1>CHỨNG CHỈ TOEIC</h1>
          <p>Certificate of Achievement</p>
        </div>
        <div class="content">
          <p>This is to certify that</p>
          <div class="name">${name}</div>
          <p>has achieved a total score of</p>
          <div class="score">${totalScore}</div>
          <p>in the TOEIC Test</p>
        </div>
        <div class="details">
          <div class="detail-item">
            <strong>Reading Score</strong>
            ${readingScore}
          </div>
          <div class="detail-item">
            <strong>Listening Score</strong>
            ${listeningScore}
          </div>
          <div class="detail-item">
            <strong>National ID</strong>
            ${nationalID}
          </div>
        </div>
        <div class="details">
          <div class="detail-item">
            <strong>Issue Date</strong>
            ${formattedIssueDate}
          </div>
          <div class="detail-item">
            <strong>Expiration Date</strong>
            ${formattedExpirationDate}
          </div>
        </div>
        <div class="footer">
          <p>This certificate is issued and verified on the blockchain</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
