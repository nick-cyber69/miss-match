import { ImageUploader } from '@/components/image-uploader'

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="text-center mb-12">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Miss Match
        </h1>
        <p className="text-gray-600 mt-2">AI-Powered Virtual Fashion Try-On</p>
      </header>

      <div className="grid lg:grid-cols-3 gap-8">
        <div>
          <ImageUploader />
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Choose Garment</h2>
          <p className="text-gray-500">Coming soon...</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Result</h2>
          <p className="text-gray-500">Coming soon...</p>
        </div>
      </div>
    </div>
  )
}