import { ArtifactCard } from '../../canvas/artifact-card'
import { usePart } from '../context'
import { ArtifactPartType } from '../types'

/**
 * Display an artifact card in the chat message when artifact part is available
 * @param className - custom styles for the artifact
 */
export function ArtifactPartUI({ className }: { className?: string }) {
  const part = usePart(ArtifactPartType)
  if (!part) return null
  return <ArtifactCard data={part.data} className={className} />
}
