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
