import Foundation
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
    @StateObject private var updates=PublicAppUpdates(feed:"https://lachlan.lazying.art/Bunko/updates.json",platform:"ios",prefix:"watch.app-updates")
    @Environment(\.scenePhase) private var scenePhase
    var body: some View {
        NavigationStack(path: $path) {
            List {
                if updates.showPrompt {Section {
                    Text("Update available").font(.headline)
                    Text("Update the app from the App Store on your iPhone.").font(.footnote)
                    Link("Open store",destination:URL(string:"https://apps.apple.com/app/id6815137919?platform=appleWatch")!)
                    Button("Later"){updates.dismiss()}
                }}
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
                Section {
                    Button("Check for updates"){Task{await updates.check(force:true)}}.disabled(updates.checking)
                    if !updates.status.isEmpty {Text(LocalizedStringKey(updates.status)).font(.footnote).foregroundStyle(.secondary)}
                    if updates.version != nil && !updates.showPrompt {Link("Open store",destination:URL(string:"https://apps.apple.com/app/id6815137919?platform=appleWatch")!)}
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
        .task{await updates.check()}
        .onChange(of:scenePhase){phase in if phase == .active {Task{await updates.check()}}}
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
            if showRuby && !line.isRightToLeft && line.tokens.contains(where: { $0.ruby?.isEmpty == false }) {
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
        .environment(\.layoutDirection, line.isRightToLeft ? .rightToLeft : .leftToRight)
        .multilineTextAlignment(.leading)
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

// Public release checks are independent of accounts, papers and purchases.
@MainActor
final class PublicAppUpdates: ObservableObject {
  @Published var version: String?
  @Published var status = ""
  @Published private(set) var checking = false
  @Published private var snoozed = false
  private var checkedAt = Date.distantPast
  private let feed: String
  private let platform: String
  private let prefix: String
  private var releaseKey = ""
  init(feed:String, platform:String, prefix:String) { self.feed=feed;self.platform=platform;self.prefix=prefix }
  var showPrompt:Bool {version != nil && !snoozed}
  static func compare(_ a:String,_ b:String)->Int? {
    func parts(_ value:String)->[Int]? {let values=value.split(separator:".",omittingEmptySubsequences:false);guard (1...4).contains(values.count),values.allSatisfy({!$0.isEmpty && $0.count<=8 && $0.allSatisfy({$0.isASCII && $0.isNumber})}) else{return nil};return values.compactMap{Int($0)}}
    guard let left=parts(a),let right=parts(b) else{return nil}
    for i in 0..<max(left.count,right.count) {let x=i<left.count ? left[i] : 0,y=i<right.count ? right[i] : 0;if x != y{return x>y ? 1 : -1}}
    return 0
  }
  func dismiss() {UserDefaults.standard.set(releaseKey,forKey:prefix+".release");UserDefaults.standard.set(Date().timeIntervalSince1970,forKey:prefix+".dismissed");snoozed=true}
  func check(force:Bool=false) async {
    guard !checking else{return}
    let now=Date()
    guard force || now.timeIntervalSince(checkedAt)>=21600 else {refreshSnooze();return}
    checking=true;status="Checking for updates…"
    defer {checking=false}
    do {
      let config=URLSessionConfiguration.ephemeral;config.httpCookieStorage=nil;config.httpShouldSetCookies=false;config.timeoutIntervalForRequest=12;config.timeoutIntervalForResource=15
      let session=URLSession(configuration:config);defer{session.finishTasksAndInvalidate()}
      let (data,response)=try await session.data(for:URLRequest(url:URL(string:feed)!,cachePolicy:.reloadIgnoringLocalCacheData,timeoutInterval:12))
      guard let http=response as? HTTPURLResponse,http.statusCode==200,data.count<=65536,let object=try JSONSerialization.jsonObject(with:data) as? [String:Any],object["schema"] as? Int==1 else{throw URLError(.badServerResponse)}
      guard let entry=object[platform] else{throw URLError(.cannotParseResponse)}
      if entry is NSNull {version=nil;status="You’re up to date.";checkedAt=now;return}
      guard let release=entry as? [String:Any],let available=release["version"] as? String,let build=release["build"] as? String,
        let installed=Bundle.main.object(forInfoDictionaryKey:"CFBundleShortVersionString") as? String,
        let installedBuild=Bundle.main.object(forInfoDictionaryKey:"CFBundleVersion") as? String,
        let v=Self.compare(available,installed),let b=Self.compare(build,installedBuild) else{throw URLError(.cannotParseResponse)}
      version=(v>0 || (v==0 && b>0)) ? available : nil;releaseKey=platform+":"+available+":"+build;refreshSnooze()
      status=version == nil ? "You’re up to date." : "Update available";checkedAt=now
    } catch {status="Could not check for updates. Try again when online.";checkedAt=now.addingTimeInterval(-20700)}
  }
  private func refreshSnooze(){let at=UserDefaults.standard.double(forKey:prefix+".dismissed"),now=Date().timeIntervalSince1970;snoozed=UserDefaults.standard.string(forKey:prefix+".release")==releaseKey && at>0 && at<=now && now-at<86400}
}
