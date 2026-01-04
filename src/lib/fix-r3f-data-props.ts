import * as THREE from "three";

// React Three Fiber treats "data-foo-bar" as "object.data.foo.bar".
// This patch ensures that THREE.Object3D (and derived classes like Mesh) 
// have a "data" property that can safely accept these nested assignments 
// without crashing or requiring manual prop filtering.

if (typeof window !== "undefined") {
    // Only patch in browser environment
    const prototype = THREE.Object3D.prototype as any;

    if (!prototype.data) {
        Object.defineProperty(prototype, "data", {
            get() {
                if (!this._data) {
                    this._data = {
                        orchids: {
                            name: "", // Placeholder for 'data-orchids-name'
                        },
                    };
                }
                return this._data;
            },
            // Allow trying to set 'data' entirely (rare but safe)
            set(v) {
                this._data = v;
            },
            configurable: true,
        });
    }
}
