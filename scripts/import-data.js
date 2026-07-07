const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabase = createClient(
  'https://dlfnlihezsmbdpsmnker.supabase.co',
  process.env.SUPABASE_SECRET_KEY
)

function parseCSVSkipRows(filePath, skip) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')
  const headers = parseCSVLine(lines[skip])
  const rows = []
  for (let i = skip + 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue
    const values = parseCSVLine(lines[i])
    const row = {}
    headers.forEach((h, idx) => { row[h.trim()] = values[idx] ?? '' })
    rows.push(row)
  }
  return rows
}

function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')
  const headers = parseCSVLine(lines[0])
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue
    const values = parseCSVLine(lines[i])
    const row = {}
    headers.forEach((h, idx) => { row[h.trim()] = values[idx] ?? '' })
    rows.push(row)
  }
  return rows
}

function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (line[i] === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += line[i]
    }
  }
  result.push(current)
  return result
}

async function importProperties() {
  console.log('匯入飯店資料...')
  const rows = parseCSVSkipRows('/Users/yenhua_tu/Downloads/Property Management Sheet - Property_Master.csv', 1)
    .filter(r => r['ID'] && /^\d+$/.test(r['ID'].trim()))

  const properties = []
  for (const row of rows) {
    const id = parseInt(row['ID'])
    if (!id || !row['name_en']) continue
    properties.push({
      id,
      name_en: row['name_en'],
      country: row['country'] || null,
      prefecture: row['prefecture'] || null,
      region: row['country'] === 'Japan' ? 'japan' : row['country'] === 'Taiwan' ? 'taiwan' : 'other',
      status: row['status'] || null,
    })
  }

  console.log(`準備匯入 ${properties.length} 間飯店`)

  // batch insert 500 筆一次
  for (let i = 0; i < properties.length; i += 500) {
    const batch = properties.slice(i, i + 500)
    const { error } = await supabase.from('properties').upsert(batch, { onConflict: 'id' })
    if (error) { console.error('飯店匯入錯誤:', error.message); return false }
    process.stdout.write(`\r  ${Math.min(i + 500, properties.length)} / ${properties.length}`)
  }
  console.log('\n飯店匯入完成')
  return true
}

async function importStories() {
  console.log('匯入旅行故事...')
  const rows = parseCSV('/Users/yenhua_tu/Downloads/Taiwan_Global_JP travel story list - Extract 5.csv')

  const stories = []
  const tagsToInsert = []

  const seen = new Set()
  for (const row of rows) {
    const id = parseInt(row['id'])
    const propertyId = parseInt(row['property_id'])
    if (!id || seen.has(id)) continue
    seen.add(id)

    const title = row['zh_tw_title'] || row['title'] || null
    const description = row['zh_tw_description'] || row['description'] || null

    stories.push({
      id,
      property_id: propertyId || null,
      neighbor_id: row['neighbor_id'] || null,
      author_email: row['email'] || null,
      title,
      description,
      zh_tw_title: row['zh_tw_title'] || null,
      zh_tw_description: row['zh_tw_description'] || null,
      locale: row['locale'] || null,
      hafh_region: row['hafh_region'] || row['property_location_cohort'] || null,
      likes_count: parseInt(row['likes_count']) || 0,
      images_count: parseInt(row['images_count']) || 0,
      cover_image_id: row['cover_image_id'] || null,
      published_at: row['published_at'] || null,
      hafh_url: `https://www.hafh.com/zh-tw/travel-stories/${id}`,
    })

    // 解析 tags
    const tagStr = row['ai_generated_tags'] || ''
    if (tagStr) {
      tagStr.split(',').forEach(t => {
        const tag = t.trim()
        if (tag) tagsToInsert.push({ story_id: id, tag })
      })
    }
  }

  console.log(`準備匯入 ${stories.length} 則故事`)

  for (let i = 0; i < stories.length; i += 200) {
    const batch = stories.slice(i, i + 200)
    const { error } = await supabase.from('travel_stories').upsert(batch, { onConflict: 'id' })
    if (error) { console.error('故事匯入錯誤:', error.message); return false }
    process.stdout.write(`\r  故事 ${Math.min(i + 200, stories.length)} / ${stories.length}`)
  }
  console.log('\n故事匯入完成')

  console.log(`準備匯入 ${tagsToInsert.length} 個標籤`)
  for (let i = 0; i < tagsToInsert.length; i += 500) {
    const batch = tagsToInsert.slice(i, i + 500)
    const { error } = await supabase.from('story_tags').upsert(batch)
    if (error) { console.error('標籤匯入錯誤:', error.message); return false }
    process.stdout.write(`\r  標籤 ${Math.min(i + 500, tagsToInsert.length)} / ${tagsToInsert.length}`)
  }
  console.log('\n標籤匯入完成')
  return true
}

async function main() {
  const ok1 = await importProperties()
  if (!ok1) return
  const ok2 = await importStories()
  if (!ok2) return
  console.log('\n全部完成！')
}

main()
