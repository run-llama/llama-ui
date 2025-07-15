import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import FileUploaderDemo from './pages/FileUploaderDemo'
import ExtractedDataDemo from './pages/ExtractedDataDemo'
import PdfViewerDemo from './pages/PdfViewerDemo'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/file-uploader" element={<FileUploaderDemo />} />
            <Route path="/extracted-data" element={<ExtractedDataDemo />} />
            <Route path="/pdf-viewer" element={<PdfViewerDemo />} />
          </Routes>
        </div>
      </div>
    </Router>
  )
}

export default App