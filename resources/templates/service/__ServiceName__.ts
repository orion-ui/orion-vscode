/**
 * @orion/template-name Default
 * @orion/template-desc Default template for Service creation
 */

class __ServiceName__ {
}

// Singleton instance initialized only when first requested
let __serviceName__Singleton: __ServiceName__;

export function use__ServiceName__ (newInstance = false) {
	if (newInstance) {
		return new __ServiceName__();
	}
	else if (!__serviceName__Singleton) {
		__serviceName__Singleton = new __ServiceName__();
	}

	return __serviceName__Singleton;
}
