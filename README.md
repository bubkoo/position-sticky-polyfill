position-sticky-polyfill
========================

- © bubkoo@163.com
- MIT License.

### Usage

Include the polyfill:

```javascript
<script src="sticky.js"></script>
```
Next, initialize your sticky nodes:

```javascript
// sticky top
sticky('#my-element', { top: 10 }, callback);
// or
sticky('#my-element', 10, callback);
// sticky bottom
sticky('#my-element',{ bottom: 10 },callback);
```
Note: callback is optional.

### Browser Support

- IE6+
- Firefox
- Chrome
- Safari
- Opera


