import Foundation

struct WatchToken: Codable, Equatable {
    let text: String
    let ruby: String?
}

struct WatchLine: Codable, Equatable {
    let lang: String
    let tokens: [WatchToken]
    var text: String { tokens.map(\.text).joined() }
    var languageLabel: String {
        ["en": "English", "zh": "中文", "ja": "日本語", "wenyan": "文言", "zh_modern": "现代中文", "ja_modern": "現代日本語"][lang] ?? lang
    }
    var isValid: Bool {
        ["en", "zh", "ja", "wenyan", "zh_modern", "ja_modern"].contains(lang) &&
        !tokens.isEmpty && tokens.count <= 2048 && tokens.allSatisfy {
            !$0.text.isEmpty && $0.text.utf8.count <= 6000 && ($0.ruby?.utf8.count ?? 0) <= 512
        }
    }
}

struct WatchSentence: Codable, Equatable {
    let lines: [WatchLine]
    var plainText: String { lines.map(\.text).joined(separator: "\n\n") }
    var isValid: Bool {
        !lines.isEmpty && lines.count <= 6 && lines.allSatisfy(\.isValid) &&
        Set(lines.map(\.lang)).count == lines.count
    }
}

/// A bounded excerpt with optional ruby-aware, source-aligned sentence units.
/// Plain blocks keep existing Watch caches and older paired apps compatible.
struct WatchReading: Codable, Identifiable, Equatable {
    let id: String
    let title: String
    let subtitle: String
    let blocks: [String]
    let truncated: Bool
    var sentences: [WatchSentence]? = nil

    var isValid: Bool {
        let validSentences = sentences.map { units in
            units.count == blocks.count && units.allSatisfy(\.isValid) &&
            zip(units, blocks).allSatisfy { $0.plainText == $1 }
        } ?? true
        return validSentences && !id.isEmpty && id.utf8.count <= 256 && !title.isEmpty && title.utf8.count <= 600 &&
        subtitle.utf8.count <= 600 && !blocks.isEmpty && blocks.count <= 24 &&
        blocks.allSatisfy { !$0.isEmpty && $0.utf8.count <= 6000 } &&
        ((try? JSONEncoder().encode(self).count) ?? Int.max) <= 15000
    }
}

struct WatchShelf: Codable {
    let schema: Int
    let readings: [WatchReading]

    static func decode(_ data: Data) -> WatchShelf? {
        guard data.count <= 50000, let shelf = try? JSONDecoder().decode(Self.self, from: data),
              shelf.schema == 1, shelf.readings.count <= 3,
              Set(shelf.readings.map(\.id)).count == shelf.readings.count,
              shelf.readings.allSatisfy(\.isValid) else { return nil }
        return shelf
    }
}
