import SrtParser from 'srt-parser-2'
import { z } from 'zod'

// Zod schemas for validation
const TimestampSchema = z.object({
  hours: z.number().min(0).max(99),
  minutes: z.number().min(0).max(59),
  seconds: z.number().min(0).max(59),
  milliseconds: z.number().min(0).max(999),
})

const SubtitleSchema = z.object({
  id: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  text: z.string(),
  start: z.number().optional(),
  end: z.number().optional(),
})

export type ParsedSubtitle = z.infer<typeof SubtitleSchema>

export class SRTParser {
  private parser: SrtParser

  constructor() {
    this.parser = new SrtParser()
  }

  /**
   * Parse SRT content into structured subtitle objects
   */
  parse(content: string): ParsedSubtitle[] {
    try {
      // Use srt-parser-2 for initial parsing
      const parsed = this.parser.fromSrt(content)
      
      // Validate and transform the parsed data
      const subtitles: ParsedSubtitle[] = []
      
      for (let i = 0; i < parsed.length; i++) {
        const item = parsed[i]
        if (!item) continue
        
        const subtitle: ParsedSubtitle = {
          id: String(item.id || i + 1),
          startTime: item.startTime || '00:00:00,000',
          endTime: item.endTime || '00:00:00,000',
          text: item.text || '',
          start: this.timeToSeconds(item.startTime || '00:00:00,000'),
          end: this.timeToSeconds(item.endTime || '00:00:00,000'),
        }
        
        // Validate schema
        const result = SubtitleSchema.safeParse(subtitle)
        if (result.success) {
          subtitles.push(result.data)
        } else {
          console.warn(`Invalid subtitle at index ${i}:`, result.error)
        }
      }
      
      return subtitles
    } catch (error) {
      throw new Error(`Failed to parse SRT: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Format subtitles back to SRT string
   */
  format(subtitles: ParsedSubtitle[]): string {
    try {
      const srtArray = subtitles.map((subtitle) => ({
        id: subtitle.id,
        startTime: subtitle.startTime,
        endTime: subtitle.endTime,
        text: subtitle.text,
        startSeconds: subtitle.start ?? this.timeToSeconds(subtitle.startTime),
        endSeconds: subtitle.end ?? this.timeToSeconds(subtitle.endTime),
      }))
      
      return this.parser.toSrt(srtArray)
    } catch (error) {
      throw new Error(`Failed to format SRT: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Batch subtitles for processing
   */
  batchSubtitles(subtitles: ParsedSubtitle[], batchSize: number = 10): ParsedSubtitle[][] {
    const batches: ParsedSubtitle[][] = []
    
    for (let i = 0; i < subtitles.length; i += batchSize) {
      const batch = subtitles.slice(i, Math.min(i + batchSize, subtitles.length))
      batches.push(batch)
    }
    
    return batches
  }

  /**
   * Calculate optimal batch size based on text complexity
   */
  calculateOptimalBatchSize(subtitles: ParsedSubtitle[]): number {
    if (subtitles.length === 0) return 10
    
    // Calculate average text length
    let totalLength = 0
    let totalDuration = 0
    
    for (let i = 0; i < subtitles.length; i++) {
      const subtitle = subtitles[i]
      if (!subtitle) continue
      
      totalLength += subtitle.text.length
      const subtitleDuration = (subtitle.end || 0) - (subtitle.start || 0)
      const cps = subtitle.text.length / subtitleDuration
      
      // Penalize high CPS (characters per second) as it indicates dense content
      if (cps > 20) {
        totalDuration += subtitleDuration * 1.5
      } else {
        totalDuration += subtitleDuration
      }
    }
    
    const avgLength = totalLength / subtitles.length
    const complexity = avgLength / 50 // Normalize to a complexity score
    
    // Adjust batch size based on complexity
    // More complex = smaller batches
    if (complexity > 3) return 5
    if (complexity > 2) return 8
    if (complexity > 1) return 10
    return 15
  }

  /**
   * Convert SRT timestamp to seconds
   */
  private timeToSeconds(time: string): number {
    const [hours, minutes, secondsWithMs] = time.split(':')
    if (!secondsWithMs) return 0
    
    const [seconds, milliseconds] = secondsWithMs.split(',')
    
    return (
      parseInt(hours || '0') * 3600 +
      parseInt(minutes || '0') * 60 +
      parseInt(seconds || '0') +
      parseInt(milliseconds || '0') / 1000
    )
  }

  /**
   * Convert seconds to SRT timestamp format
   */
  private secondsToSRTTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.round((seconds % 1) * 1000)
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`
  }

  /**
   * Convert milliseconds to SRT timestamp format
   */
  private millisecondsToSRTTime(ms: number): string {
    return this.secondsToSRTTime(ms / 1000)
  }
}
