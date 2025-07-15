import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          LlamaIndex UI Components
        </h1>
        <p className="text-lg text-gray-600">
          Vite + React integration examples
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          to="/file-uploader"
          className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            File Uploader
          </h3>
          <p className="text-gray-600">
            Drag and drop file upload with progress tracking
          </p>
        </Link>

        <Link
          to="/extracted-data"
          className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Extracted Data
          </h3>
          <p className="text-gray-600">
            Display and edit extracted data with confidence indicators
          </p>
        </Link>

        <Link
          to="/pdf-viewer"
          className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            PDF Viewer
          </h3>
          <p className="text-gray-600">
            View PDFs with navigation and annotation support
          </p>
        </Link>
      </div>
    </div>
  )
}