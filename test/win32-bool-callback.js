// Run with the freshly built Windows MeshAgent, not Node. Creates its own hidden
// windows so callback continuation can be verified even on a CI desktop.
var user32;
var windows = [];
function check(ok, message) { if (!ok) { throw new Error(message); } console.log('PASS: ' + message); }
function value(v) { return typeof v == 'number' ? v : v.Val; }
try
{
    var GM = require('_GenericMarshal');
    check(typeof GM.CreateBoolCallbackProxy == 'function', 'BOOL callback factory is available');
    user32 = GM.CreateNativeProxy('user32.dll');
    ['CreateWindowExW', 'DestroyWindow', 'EnumWindows'].forEach(function (name) { user32.CreateMethod(name); });
    var cls = GM.CreateVariable('STATIC', { wide: true });
    var title = GM.CreateVariable('MeshAgent BOOL callback test', { wide: true });
    for (var i = 0; i < 2; ++i)
    {
        var h = value(user32.CreateWindowExW(0, cls, title, 0, 0, 0, 100, 100, 0, 0, 0, 0));
        check(h != 0, 'test window created');
        windows.push(h);
    }

    var seen = [];
    var proxy = GM.CreateBoolCallbackProxy(function (hwnd) { seen.push(value(hwnd)); return true; }, 2);
    check(value(user32.EnumWindows(proxy.Callback, proxy.State)) != 0, 'TRUE callback completes enumeration');
    check(seen.indexOf(windows[0]) >= 0 && seen.indexOf(windows[1]) >= 0, 'callback sees both test windows');

    var count = 0;
    proxy = GM.CreateBoolCallbackProxy(function () { ++count; return false; }, 2);
    check(value(user32.EnumWindows(proxy.Callback, proxy.State)) == 0 && count == 1, 'FALSE callback stops after one window');
    check(value(user32.EnumWindows(proxy.Callback, 0)) == 0, 'NULL callback state fails safely');

    count = 0;
    proxy = GM.CreateBoolCallbackProxy(function () { ++count; return 0; }, 2);
    check(value(user32.EnumWindows(proxy.Callback, proxy.State)) == 0 && count == 1, 'numeric zero returns FALSE');
    count = 0;
    proxy = GM.CreateBoolCallbackProxy(function () { ++count; return 1; }, 2);
    check(value(user32.EnumWindows(proxy.Callback, proxy.State)) != 0 && count >= 2, 'numeric one returns TRUE');

    var rejected = false;
    try { GM.CreateBoolCallbackProxy(function () {}, 3); } catch (e) { rejected = true; }
    check(rejected, 'unsupported callback signatures are rejected');
    check(typeof GM.CreateCallbackProxy(function () {}, 2).Callback != 'undefined', 'legacy void callback factory remains available');

    windows.forEach(function (hwnd) { user32.DestroyWindow(hwnd); });
    windows = [];
    console.log('NATIVE BOOL CALLBACK TESTS PASSED (' + (GM.PointerSize * 8) + '-bit)');
    process.exit(0);
}
catch (e)
{
    if (user32) { windows.forEach(function (hwnd) { user32.DestroyWindow(hwnd); }); }
    console.log('NATIVE BOOL CALLBACK TEST FAILED: ' + e);
    process.exit(1);
}
