import Foundation

struct WatchToken: Codable, Equatable {
    let text: String
    let ruby: String?
}

struct WatchLine: Codable, Equatable {
    let lang: String
    let tokens: [WatchToken]
    var breaks: [Int]? = nil
    var text: String { tokens.map(\.text).joined() }
    var sentenceLines: [WatchLine] {
        guard let breaks, validBreaks else { return [self] }
        let ends = [0] + breaks + [tokens.count]
        return zip(ends, ends.dropFirst()).map { start, end in
            WatchLine(lang: lang, tokens: Array(tokens[start..<end]))
        }
    }
    private var validBreaks: Bool {
        guard let breaks else { return true }
        guard breaks.count < tokens.count else { return false }
        var previous = 0
        for point in breaks {
            guard point > previous, point < tokens.count else { return false }
            previous = point
        }
        return true
    }
    var languageLabel: String {
        ["en": "English", "zh": "中文", "ja": "日本語", "wenyan": "文言", "zh_modern": "现代中文", "ja_modern": "現代日本語"][lang] ?? Locale.current.localizedString(forIdentifier: lang) ?? lang
    }
    var isRightToLeft: Bool {
        if let script = Locale(identifier: lang).scriptCode {
            return ["Arab", "Hebr", "Thaa", "Nkoo", "Adlm", "Rohg", "Syrc", "Mand", "Samr"].contains(script)
        }
        return Locale.characterDirection(forLanguage: lang) == .rightToLeft
    }
    var isValid: Bool {
        lang.utf8.count <= 63 && !["src", "rich", "annotation"].contains(lang) &&
        (lang.range(of: #"^[A-Za-z]{2,8}(-[A-Za-z0-9]{1,8})*$"#, options: .regularExpression) != nil ||
         ["wenyan", "zh_modern", "ja_modern"].contains(lang)) &&
        !tokens.isEmpty && tokens.count <= 2048 && validBreaks && tokens.allSatisfy {
            !$0.text.isEmpty && $0.text.utf8.count <= 6000 && ($0.ruby?.utf8.count ?? 0) <= 512
        }
    }
}

struct WatchSentence: Codable, Equatable {
    let lines: [WatchLine]
    var plainText: String { lines.map(\.text).joined(separator: "\n\n") }
    var isValid: Bool {
        !lines.isEmpty && lines.allSatisfy(\.isValid) &&
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
