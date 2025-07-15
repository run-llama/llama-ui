import { Link } from 'react-router-dom'

export default function FileUploaderDemo() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <Link to="/" className="text-blue-600 hover:text-blue-800">
          ← Back to Home
        </Link>
      </div>

      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          File Uploader Demo
        </h1>
        <p className="text-lg text-gray-600">
          Drag and drop file upload with progress tracking
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center text-gray-500 py-12">
          {/* File uploader component will be implemented here */}
          <p>File uploader component will be integrated here</p>
        </div>
      </div>
    </div>
  )
}