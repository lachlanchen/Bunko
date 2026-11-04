namespace Bunko.Windows;
public static class DesktopPolicy {
 public const string Home="https://lachlan.lazying.art/Bunko/";
 public static bool Owned(Uri? uri)=>uri is not null&&uri.Scheme=="https"&&uri.Host=="lachlan.lazying.art"&&uri.IsDefaultPort&&string.IsNullOrEmpty(uri.UserInfo)&&(uri.AbsolutePath=="/Bunko"||uri.AbsolutePath.StartsWith("/Bunko/",StringComparison.Ordinal));
 public static bool External(Uri? uri)=>uri is not null&&(uri.Scheme=="https"||uri.Scheme=="http")&&string.IsNullOrEmpty(uri.UserInfo);
 public static bool Popup(Uri? uri)=>uri is not null&&uri.Scheme=="https"&&uri.IsDefaultPort&&string.IsNullOrEmpty(uri.UserInfo)&&string.IsNullOrEmpty(uri.Fragment)&&((uri.Host=="github.com"&&uri.AbsolutePath=="/login/oauth/authorize")||(uri.Host=="llm.lazying.art"&&uri.AbsolutePath=="/bunko/oauth/lazyingart")||uri.Host=="checkout.stripe.com"||uri.Host=="billing.stripe.com");
}
