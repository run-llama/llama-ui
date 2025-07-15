import { Link } from 'react-router-dom'

export default function ExtractedDataDemo() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <Link to="/" className="text-blue-600 hover:text-blue-800">
          ← Back to Home
        </Link>
      </div>

      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Extracted Data Demo
        </h1>
        <p className="text-lg text-gray-600">
          Display and edit extracted data with confidence indicators
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center text-gray-500 py-12">
          {/* Extracted data component will be implemented here */}
          <p>Extracted data component will be integrated here</p>
        </div>
      </div>
    </div>
  )
}