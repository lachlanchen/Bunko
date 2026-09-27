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
  print("PASS: Unicode persistence, malformed data, schema, duplicate IDs and payload limits")
 }
}
