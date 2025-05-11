# AI Resume Analyzer

A tool that helps job seekers improve their resumes through AI-powered feedback and analysis.

## What it does

This app analyzes resumes and provides detailed feedback on:

- Skills assessment (technical skills, soft skills, skill gaps)
- Experience evaluation (achievements vs responsibilities, career progression)
- Education qualifications
- Resume format and structure
- Specific improvement suggestions

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: FastAPI (Python)
- **PDF Processing**: PyPDF2
- **AI**: OpenAI GPT API

## Getting Started

### Prerequisites

- Python 3.7+
- Node.js (optional, for development)

### Installation

1. Clone the repo
   ```
   git clone https://github.com/yourusername/ai-resume-analyzer.git
   cd ai-resume-analyzer
   ```

2. Install backend dependencies
   ```
   cd backend
   pip install -r requirements.txt
   ```

3. Run the backend server
   ```
   uvicorn main:app --reload
   ```

4. Open the frontend
   - Navigate to the `frontend` folder
   - Open `index.html` in your browser or use a simple HTTP server:
     ```
     cd frontend
     python -m http.server
     ```

## Usage

1. Open the application in your browser
2. Enter your OpenAI API key (this is required to analyze resumes)
3. Upload a PDF resume
4. Click "Analyze Resume"
5. Review the detailed feedback provided

## Privacy Note

This tool requires an OpenAI API key to function. Your resume data is processed through OpenAI's API, but is not stored permanently. If you have privacy concerns, please review OpenAI's privacy policy.

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Contact

Your Name - [@yourtwitter](https://twitter.com/yourtwitter) - email@example.com

Project Link: [https://github.com/yourusername/ai-resume-analyzer](https://github.com/yourusername/ai-resume-analyzer)
