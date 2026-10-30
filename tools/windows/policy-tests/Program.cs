using Bunko.Windows;
var checks=0;
void Check(bool value){if(!value)throw new Exception("Failed check "+checks);checks++;}
Check(DesktopPolicy.Owned(new(DesktopPolicy.Home)));
Check(DesktopPolicy.Owned(new(DesktopPolicy.Home+"?book=analects")));
foreach(var value in new[]{"http://lachlan.lazying.art/Bunko/","https://evil.example/Bunko/","https://lachlan.lazying.art/Bunko-other/","https://lachlan.lazying.art/","https://user@lachlan.lazying.art/Bunko/","https://lachlan.lazying.art:444/Bunko/"})Check(!DesktopPolicy.Owned(new(value)));
foreach(var value in new[]{"file:///C:/windows/system.ini","javascript:alert(1)","data:text/html,x","https://user:password@example.org/"})Check(!DesktopPolicy.External(new(value)));
Check(DesktopPolicy.Popup(new("https://github.com/login/oauth/authorize?state=example")));
Check(DesktopPolicy.Popup(new("https://llm.lazying.art/bunko/oauth/lazyingart?ticket=example")));
foreach(var value in new[]{"https://github.com/login","https://github.com.evil.example/login/oauth/authorize","https://llm.lazying.art/other","http://github.com/login/oauth/authorize","https://github.com/login/oauth/authorize#x"})Check(!DesktopPolicy.Popup(new(value)));
Console.WriteLine(checks+" navigation/auth destination checks passed");

void UpdateCheck(bool ok){if(!ok)throw new Exception("Update policy failed");}
UpdateCheck(AppUpdatePolicy.Compare("1.10","1.9")>0);UpdateCheck(AppUpdatePolicy.Compare("1.2","1.2.0")==0);
UpdateCheck(AppUpdatePolicy.Newer("1.1","1","1.0","99"));UpdateCheck(AppUpdatePolicy.Newer("1.1","10","1.1","9"));
UpdateCheck(!AppUpdatePolicy.Newer("1.0.9","39","1.0.10","40"));UpdateCheck(!AppUpdatePolicy.Newer("1.1","9","1.1","10"));UpdateCheck(!AppUpdatePolicy.Newer("1.1","10","1.1","10"));
foreach(var invalid in new[]{"bad","1..2","1.2-beta","999999999999"}){try{AppUpdatePolicy.Compare(invalid,"1");throw new Exception("accepted invalid version");}catch(FormatException){}}
var at=DateTimeOffset.UtcNow;UpdateCheck(AppUpdatePolicy.Snoozed("x","x",at,at.AddSeconds(1)));UpdateCheck(!AppUpdatePolicy.Snoozed("y","x",at,at.AddSeconds(1)));UpdateCheck(!AppUpdatePolicy.Snoozed("x","x",at,at.AddDays(1)));UpdateCheck(!AppUpdatePolicy.Snoozed("x","x",at.AddSeconds(1),at));
Console.WriteLine("15 Windows update policy checks passed.");
