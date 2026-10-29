using System.Diagnostics;
using System.IO;
using System.Text.Json;
using System.Windows;
using System.Windows.Input;
using System.Windows.Interop;
using Microsoft.Web.WebView2.Core;
namespace Bunko.Windows;
public partial class MainWindow : Window {
 readonly bool selfTest=Environment.GetCommandLineArgs().Contains("--self-test");
 readonly string qaID=Guid.NewGuid().ToString("N");
 readonly List<CoreWebView2Controller> popups=new();
 CoreWebView2Environment? environment;
 bool closed,selfTestStarted;
 public MainWindow(){InitializeComponent();if(selfTest){ShowActivated=false;ShowInTaskbar=false;Opacity=0;Left=-16000;Top=-16000;}Loaded+=Initialize;Closed+=(_,_)=>{closed=true;foreach(var p in popups.ToArray())p.Close();popups.Clear();Reader.Dispose();};PreviewKeyDown+=Keys;}
 static void Restrict(CoreWebView2 core){
  core.Settings.AreHostObjectsAllowed=false;core.Settings.IsWebMessageEnabled=false;core.Settings.AreDevToolsEnabled=false;
  core.Settings.IsPasswordAutosaveEnabled=false;core.Settings.IsGeneralAutofillEnabled=false;
  core.PermissionRequested+=(_,a)=>a.State=CoreWebView2PermissionState.Deny;
  core.ServerCertificateErrorDetected+=(_,a)=>a.Action=CoreWebView2ServerCertificateErrorAction.Cancel;
 }
 async void Initialize(object sender,RoutedEventArgs e){
  try{
   var profile=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"LazyingArt","Bunko",selfTest?"QA/"+qaID:"WebView2");
   environment=await CoreWebView2Environment.CreateAsync(null,profile);
   if(closed)return;await Reader.EnsureCoreWebView2Async(environment);
   var core=Reader.CoreWebView2;Restrict(core);
   core.NavigationStarting+=(_,a)=>{if(!Uri.TryCreate(a.Uri,UriKind.Absolute,out var u)||!DesktopPolicy.Owned(u)){a.Cancel=true;if(a.IsUserInitiated&&u is not null)OpenExternal(u);}};
   core.FrameNavigationStarting+=(_,a)=>{if(!Uri.TryCreate(a.Uri,UriKind.Absolute,out var u)||!DesktopPolicy.Owned(u))a.Cancel=true;};
   core.NewWindowRequested+=Popup;
   core.ProcessFailed+=(_,_)=>Status.Text="The reading window stopped. Choose Refresh to reopen it.";
   core.NavigationCompleted+=async(_,a)=>{Status.Text=a.IsSuccess?"":"Could not connect. Check your connection, then choose Refresh.";if(selfTest&&!selfTestStarted){selfTestStarted=true;await QualifyAsync(a.IsSuccess);}};
   core.Navigate(DesktopPolicy.Home);
  }catch(Exception e2){if(selfTest){Finish(new[]{e2.GetType().Name+": "+e2.Message},false);return;}Status.Text=e2 is WebView2RuntimeNotFoundException?"Install Microsoft Edge WebView2 Runtime, then reopen Bunko.":"Bunko could not open. Close and reopen the app.";if(e2 is WebView2RuntimeNotFoundException&&MessageBox.Show(this,"Bunko needs Microsoft Edge WebView2 Runtime. Open Microsoft’s download page?","Bunko",MessageBoxButton.YesNo)==MessageBoxResult.Yes)OpenExternal(new Uri("https://developer.microsoft.com/microsoft-edge/webview2/"));}
 }
 // The web app creates an empty popup before its PKCE request resolves. Retain
 // that window object but send authorization to the user's system browser.
 // Completion is polled by the original app; HttpOnly cookies stay in WebView2.
 async void Popup(object? sender,CoreWebView2NewWindowRequestedEventArgs a){
  a.Handled=true;
  if(!a.IsUserInitiated||environment is null||closed)return;
  if(a.Uri!="about:blank"){if(Uri.TryCreate(a.Uri,UriKind.Absolute,out var uri))OpenExternal(uri);return;}
  var defer=a.GetDeferral();CoreWebView2Controller? popup=null;
  try{
   if(popups.Count>=2){Status.Text="Finish or cancel the current sign-in first.";return;}
   popup=await environment.CreateCoreWebView2ControllerAsync(new WindowInteropHelper(this).Handle);
   if(closed){popup.Close();return;}popup.IsVisible=false;popups.Add(popup);
   var current=popup;Restrict(current.CoreWebView2);
   current.CoreWebView2.NavigationStarting+=(_,n)=>{if(n.Uri=="about:blank")return;n.Cancel=true;if(Uri.TryCreate(n.Uri,UriKind.Absolute,out var uri)&&DesktopPolicy.Popup(uri)){OpenExternal(uri);Status.Text="Finish in your browser, then return to Bunko.";}};
   current.CoreWebView2.NewWindowRequested+=(_,n)=>n.Handled=true;
   current.CoreWebView2.WindowCloseRequested+=(_,_)=>ClosePopup(current);
   a.NewWindow=current.CoreWebView2;
   _=ExpirePopup(current);
  }catch{if(popup is not null)ClosePopup(popup);Status.Text="The sign-in window could not open. Please try again.";}finally{defer.Complete();}
 }
 async Task ExpirePopup(CoreWebView2Controller popup){await Task.Delay(TimeSpan.FromMinutes(11));if(!closed)ClosePopup(popup);}
 void ClosePopup(CoreWebView2Controller popup){if(popups.Remove(popup)){popup.Close();if(!closed)Status.Text="";}}
 void OpenExternal(Uri uri){if(selfTest||!DesktopPolicy.External(uri))return;try{Process.Start(new ProcessStartInfo(uri.AbsoluteUri){UseShellExecute=true});}catch(System.ComponentModel.Win32Exception){Status.Text="Your browser could not open this link.";}}
 async Task QualifyAsync(bool navigation){
  var checks=new List<string>();
  try{
   if(!navigation)throw new InvalidOperationException("HTTPS navigation failed");
   checks.Add("WPF and WebView2 initialized; HTTPS Bunko origin loaded");
   for(var n=0;n<150;n++){if(await Reader.CoreWebView2.ExecuteScriptAsync("document.querySelectorAll('[data-book-id]').length>0")=="true")break;await Task.Delay(200);}
   var count=await Reader.CoreWebView2.ExecuteScriptAsync("document.querySelectorAll('[data-book-id]').length");
   if(!int.TryParse(count,out var books)||books<1)throw new InvalidOperationException("Book library did not load");
   checks.Add("Live downloadable book catalog loaded: "+books);
   await Reader.CoreWebView2.ExecuteScriptAsync("document.querySelector('[data-book-id=sanshiro]').click()");
   for(var n=0;n<100;n++){if(await Reader.CoreWebView2.ExecuteScriptAsync("!!document.querySelector('.book-hero')")=="true")break;await Task.Delay(200);}
   if(await Reader.CoreWebView2.ExecuteScriptAsync("!!document.querySelector('.book-hero')")!="true")throw new InvalidOperationException("Book details did not open");
   checks.Add("Live book metadata and details opened");
   await Reader.CoreWebView2.ExecuteScriptAsync("document.querySelector('.actions .primary').click()");
   for(var n=0;n<150;n++){if(await Reader.CoreWebView2.ExecuteScriptAsync("!!document.querySelector('.reader [data-reading]')")=="true")break;await Task.Delay(200);}
   if(await Reader.CoreWebView2.ExecuteScriptAsync("!!document.querySelector('.reader [data-reading]')")!="true")throw new InvalidOperationException("Book passage did not load");
   checks.Add("Downloaded book chapter renders in the reader");
   if(await Reader.CoreWebView2.ExecuteScriptAsync("document.documentElement.scrollWidth<=innerWidth+1")!="true")throw new InvalidOperationException("Horizontal overflow");
   checks.Add("No horizontal overflow at desktop width");
   var path=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"LazyingArt","Bunko");Directory.CreateDirectory(path);
   await using(var f=File.Create(Path.Combine(path,"windows-self-test.png")))await Reader.CoreWebView2.CapturePreviewAsync(CoreWebView2CapturePreviewImageFormat.Png,f);
   Finish(checks,true);
  }catch(Exception e){checks.Add(e.Message);Finish(checks,false);}
 }
 void Finish(IEnumerable<string> checks,bool passed){var path=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"LazyingArt","Bunko");Directory.CreateDirectory(path);File.WriteAllText(Path.Combine(path,"windows-self-test.json"),JsonSerializer.Serialize(new{passed,checks,qaID,processId=Environment.ProcessId,at=DateTimeOffset.UtcNow,nonactivating=true,authenticated=false},new JsonSerializerOptions{WriteIndented=true}));Environment.ExitCode=passed?0:1;Close();}
 void Back_Click(object sender,RoutedEventArgs e){if(Reader.CoreWebView2?.CanGoBack==true)Reader.CoreWebView2.GoBack();}
 void Home_Click(object sender,RoutedEventArgs e)=>Reader.CoreWebView2?.Navigate(DesktopPolicy.Home);
 void Refresh_Click(object sender,RoutedEventArgs e)=>Reader.CoreWebView2?.Reload();
 void Keys(object sender,KeyEventArgs e){if(e.Key==Key.F5){Reader.CoreWebView2?.Reload();e.Handled=true;}if(e.SystemKey==Key.Left&&Keyboard.Modifiers==ModifierKeys.Alt){Back_Click(sender,new RoutedEventArgs());e.Handled=true;}}
}
