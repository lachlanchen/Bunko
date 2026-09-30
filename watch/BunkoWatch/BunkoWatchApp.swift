import SwiftUI
import WatchConnectivity

@main
struct BunkoWatchApp: App {
    @StateObject private var shelf = ReadingShelf()
    var body: some Scene {
        WindowGroup { WatchLibrary().environmentObject(shelf) }
    }
}

final class ReadingShelf: NSObject, ObservableObject, WCSessionDelegate {
    @Published private(set) var readings: [WatchReading] = []
    private let key = "bunko.watch.shelf.v1"
    override init() {
        super.init()
        if let data = UserDefaults.standard.data(forKey: key) { receive(data) }
        if WCSession.isSupported() {
            WCSession.default.delegate = self
            WCSession.default.activate()
        }
    }
    private func receive(_ data: Data) {
        guard let shelf = WatchShelf.decode(data) else { return }
        readings = shelf.readings
        UserDefaults.standard.set(data, forKey: key)
    }
    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        if let data = session.receivedApplicationContext["shelf"] as? Data {
            DispatchQueue.main.async { self.receive(data) }
        }
    }
    func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String: Any]) {
        if let data = applicationContext["shelf"] as? Data {
            DispatchQueue.main.async { self.receive(data) }
        }
    }
}

struct WatchLibrary: View {
    @EnvironmentObject private var shelf: ReadingShelf
    @State private var path: [String] = []
    var body: some View {
        NavigationStack(path: $path) {
            List {
                if shelf.readings.isEmpty {
                    VStack(alignment: .leading, spacing: 10) {
                        Image(systemName: "books.vertical.fill").font(.largeTitle).foregroundStyle(.cyan)
                        Text("A little reading, anywhere").font(.headline)
                        Text("Open a book on your iPhone and tap the watch button. Your latest three excerpts stay here offline.")
                            .font(.footnote).foregroundStyle(.secondary)
                    }.padding(.vertical, 6)
                }
                ForEach(shelf.readings) { reading in
                    NavigationLink(value: reading.id) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(reading.title).font(.headline).foregroundStyle(.cyan)
                            Text(reading.subtitle).font(.caption).foregroundStyle(.secondary).lineLimit(2)
                        }
                    }
                }
            }.navigationTitle("Bunko")
            .navigationDestination(for: String.self) { id in
                if let reading = shelf.readings.first(where: { $0.id == id }) { WatchReader(reading: reading) }
            }
            #if DEBUG
            .onReceive(shelf.$readings) { readings in
                if ProcessInfo.processInfo.arguments.contains("--reading-qa"), path.isEmpty, let reading = readings.first {
                    path = [reading.id]
                }
            }
            #endif
        }.tint(.cyan)
    }
}

struct WatchReader: View {
    let reading: WatchReading
    @AppStorage("watch.textSize") private var textSize = 17.0
    @AppStorage("watch.rubySize") private var rubySize = 9.0
    @AppStorage("watch.showRuby") private var showRuby = true
    @State private var page = 0
    @State private var sizing = false
    private var positionKey: String { reading.sentences == nil ? "watch.position.\(reading.id)" : "watch.position.v2.\(reading.id)" }
    private var currentPage: Int { min(max(0, page), reading.blocks.count - 1) }
    var body: some View {
        ScrollViewReader { scroll in
            ScrollView {
                VStack(alignment: .leading, spacing: 12) {
                    Text(reading.subtitle).font(.caption).foregroundStyle(.secondary).id("top")
                    if let sentences = reading.sentences {
                        VStack(alignment: .leading, spacing: 14) {
                            ForEach(Array(sentences[currentPage].lines.enumerated()), id: \.offset) { _, line in
                                VStack(alignment: .leading, spacing: 5) {
                                    Text(line.languageLabel)
                                        .font(.system(size: 10, weight: .bold))
                                        .foregroundStyle(line.lang.hasPrefix("ja") ? Color.orange : Color.cyan)
                                    WatchRubyLine(line: line, textSize: min(24, max(14, textSize)),
                                                  rubySize: min(13, max(7, rubySize)), showRuby: showRuby)
                                }
                            }
                        }.id("sentence-\(currentPage)")
                    } else {
                        Text(reading.blocks[currentPage])
                            .font(.system(size: min(24, max(14, textSize)), design: .serif))
                            .frame(maxWidth: .infinity, alignment: .leading)
                        Text("Send this excerpt again from your iPhone to add ruby and sentence alignment.")
                            .font(.footnote).foregroundStyle(.secondary)
                    }
                    Text("\(currentPage + 1) / \(reading.blocks.count)").font(.caption).foregroundStyle(.secondary)
                    HStack {
                        Button { page = currentPage - 1 } label: { Image(systemName: "chevron.left") }
                            .disabled(currentPage == 0).accessibilityLabel("Previous passage")
                        Button { page = currentPage + 1 } label: { Image(systemName: "chevron.right") }
                            .disabled(currentPage >= reading.blocks.count - 1).accessibilityLabel("Next passage")
                    }
                    if currentPage == reading.blocks.count - 1 {
                        Text(LocalizedStringKey(reading.truncated ? "Continue the full chapter on your iPhone." : "End of excerpt"))
                            .font(.footnote).foregroundStyle(.secondary)
                    }
                }.padding(.horizontal, 2)
            }
            .onChange(of: page) { _, value in
                UserDefaults.standard.set(value, forKey: positionKey)
                scroll.scrollTo("top", anchor: .top)
            }
        }
        .navigationTitle(reading.title)
        .toolbar { ToolbarItem(placement: .topBarTrailing) {
            Button { sizing = true } label: { Image(systemName: "textformat.size") }.accessibilityLabel("Text size")
        } }
        .sheet(isPresented: $sizing) {
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    Text("Text size").font(.headline)
                    Stepper(value: $textSize, in: 14...24, step: 1) { Text("\(Int(textSize))") }
                    Toggle("Ruby readings", isOn: $showRuby)
                    if showRuby {
                        Text("Ruby size").font(.headline)
                        Stepper(value: $rubySize, in: 7...13, step: 1) { Text("\(Int(rubySize))") }
                    }
                    Button("Done") { sizing = false }
                }.padding(.horizontal, 4)
            }
        }
        .onAppear(perform: restorePosition)
        .onChange(of: reading) { _, _ in restorePosition() }
    }
    private func restorePosition() {
        page = min(max(0, UserDefaults.standard.integer(forKey: positionKey)), reading.blocks.count - 1)
    }
}


/// Native ruby keeps annotations over their original token. Non-ruby text uses
/// normal SwiftUI text wrapping; no image or horizontally scrolling web view.
private struct WatchRubyLine: View {
    let line: WatchLine
    let textSize: Double
    let rubySize: Double
    let showRuby: Bool
    private var pieces: [WatchToken] {
        let pattern = #"\s+|[\p{Han}\p{Hiragana}\p{Katakana}]|[^\s\p{Han}\p{Hiragana}\p{Katakana}]+"#
        guard let regex = try? NSRegularExpression(pattern: pattern) else { return line.tokens }
        return line.tokens.flatMap { token -> [WatchToken] in
            if token.ruby?.isEmpty == false { return [token] }
            let ns = token.text as NSString
            return regex.matches(in: token.text, range: NSRange(location: 0, length: ns.length)).map {
                WatchToken(text: ns.substring(with: $0.range), ruby: nil)
            }
        }
    }
    var body: some View {
        Group {
            if showRuby && line.tokens.contains(where: { $0.ruby?.isEmpty == false }) {
                RubyFlowLayout {
                    ForEach(Array(pieces.enumerated()), id: \.offset) { _, token in
                        VStack(spacing: 1) {
                            Text(token.ruby ?? " ")
                                .font(.system(size: rubySize, weight: .medium))
                                .foregroundStyle(.secondary)
                                .lineLimit(1).minimumScaleFactor(0.65)
                            Text(token.text).font(.system(size: textSize, design: .serif))
                                .fixedSize(horizontal: false, vertical: true)
                        }
                        .layoutValue(key: RubyClosingPunctuation.self,
                                     value: token.text.allSatisfy { "。，、！？；：,.!?;:）」』】》〉”’".contains($0) })
                    }
                }
            } else {
                Text(line.text).font(.system(size: textSize, design: .serif))
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(line.text)
    }
}

private struct RubyClosingPunctuation: LayoutValueKey { static let defaultValue = false }

/// Measures and wraps complete ruby tokens inside the available Watch width.
/// The last character and its closing punctuation wrap together.
private struct RubyFlowLayout: Layout {
    struct Arrangement { let frames: [CGRect]; let size: CGSize }
    private func arrange(_ subviews: Subviews, width: CGFloat) -> Arrangement {
        let width = max(1, width)
        let sizes = subviews.map { view -> CGSize in
            let ideal = view.sizeThatFits(.unspecified)
            return view.sizeThatFits(ProposedViewSize(width: min(width, ideal.width), height: nil))
        }
        var frames: [CGRect] = [], x: CGFloat = 0, y: CGFloat = 0, rowHeight: CGFloat = 0
        for index in subviews.indices {
            let size = sizes[index]
            var needed = size.width
            var next = index + 1
            while next < sizes.count && subviews[next][RubyClosingPunctuation.self] {
                needed += 1 + sizes[next].width; next += 1
            }
            if x > 0 && x + min(width, needed) > width {
                x = 0; y += rowHeight + 6; rowHeight = 0
            }
            frames.append(CGRect(x: x, y: y, width: min(width, size.width), height: size.height))
            x += size.width + 1
            rowHeight = max(rowHeight, size.height)
        }
        return Arrangement(frames: frames, size: CGSize(width: width, height: y + rowHeight))
    }
    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        arrange(subviews, width: proposal.width ?? 180).size
    }
    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        for (index, frame) in arrange(subviews, width: bounds.width).frames.enumerated() {
            subviews[index].place(at: CGPoint(x: bounds.minX + frame.minX, y: bounds.minY + frame.minY),
                                 anchor: .topLeading, proposal: ProposedViewSize(frame.size))
        }
    }
}
