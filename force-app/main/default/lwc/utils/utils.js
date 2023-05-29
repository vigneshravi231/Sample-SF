

export const makeUnique = arr => [...new Set(arr || [])]

export const resolvePath = (path, object) => {
	return path.split('.').reduce((acc, v) => acc && acc[v], object)
}

export const groupBy = (arr, key) => {
	return (arr || []).reduce((acc, item) => {
		const keyValue = resolvePath(key, item);
		(acc[keyValue] = acc[keyValue] || []).push(item);

		return acc;

	}, {})
}

export const groupBy2Keys = (arr, key, key2) => {
	return (arr || []).reduce((acc, item) => {
		const keyValue = resolvePath(key, item);
		const key2Value = resolvePath(key2, item);

		const keyedBy = [keyValue || '', key2Value || ''].join('__');
		(acc[keyedBy] = acc[keyedBy] || []).push(item);

		return acc;

	}, {})
}

export const groupBySingle = (arr, key) => {
	return (arr || []).reduce((acc, item) => {
		const keyValue = resolvePath(key, item);
		acc[keyValue] = item;
		return acc;
	}, {})
}

export const flattenJSON = data => {
	let result = {};
	function recurse (cur, prop) {
		if (Object(cur) !== cur) {
			result[prop] = cur;
		} else if (Array.isArray(cur)) {
			for(let i=0, l=cur.length; i<l; i++)
				recurse(cur[i], prop + "[" + i + "]");
			if (l === 0)
				result[prop] = [];
		} else {
			let isEmpty = true;
			for (let p in cur) {
				isEmpty = false;
				recurse(cur[p], prop ? prop+"."+p : p);
			}
			if (isEmpty && prop)
				result[prop] = {};
		}
	}
	recurse(data, "");
	return result;
}

export const uuidv4 = () => {
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
		/[xy]/g,
		function (c) {
			const r = (Math.random() * 16) | 0,
				v = c === "x" ? r : (r & 0x3) | 0x8;
			return v.toString(16);
		}
	);
};

export const sureThing = promise => args =>
	promise(args)
		.then(data => ({ ok: true, data }))
		.catch(error => Promise.resolve({ ok: false, error }));

export const lower = s => (s || "").toLowerCase();

export const deepClone = (object) => {
	return JSON.parse(JSON.stringify(object));
}

export const multiSelectToArray = multiselect => multiselect?.split(';') ?? [];

export const logProxy = (msg, data) => {
	if(data !== null || true || data === 0 || data === false)  {
		console.log(msg, JSON.parse(JSON.stringify(data)));
	} else {
		console.log(msg, 'Undefined');
	}
}

export const getUrlParamValue = (url, param) => {
	return new URL(url).searchParams.get(param);
}
