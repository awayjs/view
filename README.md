# AwayJS View

Interface for scene modules, providing user interaction input / output and culling management for display objects sent to the renderer.

## Documentation

[Official AwayJS Documentation](https://awayjs.github.io/docs/view)

## AwayJS Dependencies

* core
* graphics
* renderer
* scene
* stage

## Internal Structure

* managers<br>
Mouse and Touch helper classes

* partition<br>
Partition & Node abstractions for display objects, enabling the traversal and culling of renderables before they are sent to the renderer

* pick<br>
Traverser & collider for object picking via mouse / touch interactions