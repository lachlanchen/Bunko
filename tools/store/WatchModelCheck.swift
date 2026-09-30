import Foundation
@main struct Check {
 static func main() throws {
  let good = WatchReading(id:"book/1",title:"三四郎",subtitle:"一",blocks:["読書。Reading."],truncated:false)
  precondition(good.isValid)
  let data=try JSONEncoder().encode(WatchShelf(schema:1,readings:[good]))
  precondition(WatchShelf.decode(data)?.readings == [good])
  precondition(WatchShelf.decode(Data("{bad".utf8)) == nil)
  let wrongSchema = try JSONEncoder().encode(WatchShelf(schema:2,readings:[good]))
  precondition(WatchShelf.decode(wrongSchema) == nil)
  let duplicate = try JSONEncoder().encode(WatchShelf(schema:1,readings:[good,good]))
  precondition(WatchShelf.decode(duplicate) == nil)
  precondition(!WatchReading(id:"a",title:"a",subtitle:"",blocks:[String(repeating:"文",count:2100)],truncated:false).isValid)
  let zh = WatchLine(lang: "zh", tokens: [WatchToken(text: "读", ruby: "dú"), WatchToken(text: "。", ruby: nil)])
  let ja = WatchLine(lang: "ja", tokens: [WatchToken(text: "読む", ruby: "よむ"), WatchToken(text: "。", ruby: nil)])
  let unit = WatchSentence(lines: [zh, ja])
  let ruby = WatchReading(id: "ruby/1", title: "Reading", subtitle: "", blocks: [unit.plainText], truncated: false, sentences: [unit])
  precondition(ruby.isValid)
  let rubyData = try JSONEncoder().encode(WatchShelf(schema: 1, readings: [ruby, good]))
  precondition(WatchShelf.decode(rubyData)?.readings == [ruby, good])
  let legacy = Data(#"{"schema":1,"readings":[{"id":"old","title":"Old","subtitle":"","blocks":["Text"],"truncated":false}]}"#.utf8)
  precondition(WatchShelf.decode(legacy)?.readings.first?.sentences == nil)
  var bad = ruby; bad.sentences = []
  precondition(!bad.isValid)
  bad.sentences = [WatchSentence(lines: [ja, zh])]
  precondition(!bad.isValid)
  precondition(!WatchSentence(lines: [zh, zh]).isValid)
  precondition(!WatchLine(lang: "bad_tag", tokens: zh.tokens).isValid)
  precondition(!WatchLine(lang: "ja", tokens: [WatchToken(text: "a", ruby: String(repeating: "文", count: 200))]).isValid)
  let languages = ["ar", "he", "fa", "hi", "el", "fr-CA", "es", "de"]
  let multilingual = WatchSentence(lines: languages.map { WatchLine(lang: $0, tokens: [WatchToken(text: "Text", ruby: nil)]) })
  precondition(multilingual.isValid)
  precondition(WatchLine(lang: "ar", tokens: zh.tokens).isRightToLeft)
  precondition(!WatchLine(lang: "ar-Latn", tokens: zh.tokens).isRightToLeft)
  precondition(WatchLine(lang: "az-Arab", tokens: zh.tokens).isRightToLeft)
  print("PASS: ruby roundtrip, legacy cache, aligned text, invalid language/shape/ruby bounds; Unicode persistence, malformed data, schema, duplicate IDs and payload limits")
 }
}
