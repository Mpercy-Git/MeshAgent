# Native Win32 BOOL callbacks

`_GenericMarshal.CreateBoolCallbackProxy(fn, 2)` supports synchronous Windows
callbacks with a pointer-sized argument followed by an opaque state pointer,
such as `BOOL CALLBACK WNDENUMPROC(HWND, LPARAM)`.

Pass `proxy.Callback` as the function pointer and `proxy.State` as the last
native callback argument. Keep the proxy referenced until the native call
returns, and invoke the native API on the JavaScript thread. JavaScript truthy
values return TRUE, falsy values return FALSE, and exceptions return FALSE after
being reported through the existing uncaught-exception handler. The Windows x86
callback uses `__stdcall`; the return type is Win32 BOOL on every architecture.
The existing `CreateCallbackProxy` API and its void callbacks are unchanged.

Windows CI runs `test/win32-bool-callback.js` using each freshly compiled x86,
x64 and ARM64 MeshAgent executable. The test creates two hidden top-level windows,
checks callback continuation and early termination, validates NULL-state handling
and signature rejection, then destroys its windows. It needs no installed service,
server connection, or signed-in user's application windows.

For interactive UI behavior and session dispatch, use the companion MeshCentral
fork's `agents/win-uiautomation-validation.md` checklist on an installed agent.
Older agent binaries do not expose `CreateBoolCallbackProxy`; the updated server
core detects that and uses sibling traversal instead of calling a void callback.
