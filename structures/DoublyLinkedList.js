define(
    [
        "dojo/_base/array",
        "dojo/_base/declare",
        "dojo/_base/lang",
        "./_base"
    ],
    function(array, declare, lang, base) {
        
        
        ///////////////////////////////////////////////////////////////////////
        // A doubly-linked list data structure
        //
        // Includes basic methods for inserts at the beginning of the list, 
        // the end of the list or before/after an existing node in the list.
        //
        // Supports forward and reverse iteration and handy methods for
        // map, filter and reduce.
        //
        // When nodes are returned from the DoublyLinkedList instance,
        // they should be treated as black boxes. The DoublyLinkedList's
        // next(), prev() and getObject() can be used to iterate over the list
        // and to retrieve a node's object.
        
        
        var DoublyLinkedList = declare(null, {
            
            
            ///////////////////////////////////////////////////////////////////
            // internal state
            ///////////////////////////////////////////////////////////////////
            
            // the tail pointers (first and last)
            _tails: null,
            
            // the count of nodes in the list
            _count: 0,
            
            
            ///////////////////////////////////////////////////////////////////
            // constructor
            ///////////////////////////////////////////////////////////////////
            
            constructor: function(initial) {
                
                if (lang.isArrayLike(initial)) {
                    
                    array.forEach(initial, lang.hitch(this, function(obj) {
                        
                        this.insertLast(obj);
                    }));
                }
            },
            
            
            ///////////////////////////////////////////////////////////////////
            // public api
            ///////////////////////////////////////////////////////////////////
            
            // the count of objects in the list
            count: function() {
                
                return this._count;
            },
            
            // get the object from the node
            getObject: function(node) {
                
                return node && node.obj;
            },
            
            // get the first node in the list
            first: function() {
                
                return this._tails && this._tails.first;
            },
            
            // get the last node in the list
            last: function() {
                
                return this._tails && this._tails.last;
            },
            
            // the next node in the list
            next: function(node) {
                
                return node && node.next;
            },
            
            // the previous node in the list
            prev: function(node) {
                
                return node && node.prev;
            },
            
            
            // add an object first in the list
            insertFirst: function(obj) {
                
                if (this._tails === null) {
                    
                    return this._firstInsert(obj);
                
                }
                
                this._count += 1;
                
                this._tails.first = {
                    obj: obj,
                    prev: null,
                    next: this._tails.first
                };
                
                this._tails.first.next.prev = this._tails.first;
                
                return this._tails.first;
            },
            
            // add an object last in the list
            insertLast: function(obj) {
                
                if (this._tails === null) {
                    
                    return this._firstInsert(obj);
                }
                
                this._count += 1;
                    
                this._tails.last = {
                    obj: obj,
                    prev: this._tails.last,
                    next: null
                };
                
                this._tails.last.prev.next = this._tails.last;
                
                return this._tails.last;
            },
            
            // add an object before the given node
            insertBefore: function(obj, node) {
                
                if (this._tails === null) {
                    
                    return this._firstInsert(obj);
                }
                
                node = node || null;
                
                if (node === null || node === this._tails.first) {
                    
                    return this.insertFirst(obj);
                }
                    
                this._count += 1;
                
                node.prev = {
                    obj: obj,
                    prev: node.prev,
                    next: node
                };
                
                if (node.prev.prev !== null) {
                    
                    node.prev.prev.next = node.prev;
                }
                
                return node.prev;
            },
            
            // add an object after the given node
            insertAfter: function(obj, node) {
                
                if (this._tails === null) {
                    
                    return this._firstInsert(obj);
                    
                }
                
                node = node || null;
                
                if (node === null || node === this._tails.last) {
                    
                    return this.insertLast(obj);
                }
                
                this._count += 1;
                
                node.next = {
                    obj: obj,
                    prev: node,
                    next: node.next
                };
                
                if (node.next.next !== null) {
                    
                    node.next.next.prev = node.next;
                }
                
                return node.next;
            },
            
            // replace an object at the given node
            replace: function(obj, node) {
                
                var oldObj;
                
                node = node || null;
                
                if (node !== null) {
                    
                    oldObj = node.obj;
                    node.obj = obj;
                    return oldObj;
                }
                
                return null;
            },
            
            
            // remove the first object from the list
            removeFirst: function() {
                
                var obj;
                
                if (this._tails === null) {
                    
                    return null;
                }
                
                obj = this._tails.first.obj;
                
                this._count -= 1;
                if (this._count === 0) {
                    
                    this._empty();
                    
                } else {
                    
                    this._tails.first = this._tails.first.next;
                    this._tails.first.prev = null;
                }
                
                return obj;
            },
            
            // remove the last object from the list
            removeLast: function() {
                
                var obj;
                
                if (this._tails === null) {
                    
                    return null;
                }
                
                obj = this._tails.last.obj;
                
                this._count -= 1;
                if (this._count === 0) {
                    
                    this._empty();
                
                } else {
                    
                    this._tails.last = this._tails.last.prev;
                    this._tails.last.next = null;
                }
                
                return obj;
            },
            
            // remove the given node from the list
            remove: function(node) {
                
                var obj;
                
                node = node || null;
                
                if (this._tails === null) {
                    
                    return null;
                }
                
                if (node !== null) {
                    
                    if (node === this._tails.first) {
                        
                        obj = this.removeFirst();
                        
                    } else if (node == this._tails.last) {
                        
                        obj = this.removeLast();
                        
                    } else {
                        
                        obj = node.obj;
                        
                        this._count -= 1;
                        if (this._count === 0) {
                            
                            this._empty();
                        
                        } else {
                        
                            if (node.prev !== null) {
                            
                                node.prev.next = node.next;
                            }
                        
                            if (node.next !== null) {
                            
                                node.next.prev = node.prev;
                            }
                        }
                    }
                
                } else {
                
                    return null;
                }
                
                return obj;
            },
            
            
            // empty the list
            empty: function() {
                
                this._empty();
                this._count = 0;
            },
            
            
            ///////////////////////////////////////////////////////////////////
            // iterators
            ///////////////////////////////////////////////////////////////////
            
            // for each iterator
            forEach: function(fn) {
                
                var node = this.first(),
                    i = 0;
                
                while (node !== null) {
                    
                    fn(node.obj, i, node);
                    node = node.next;
                    i += 1;
                }
            },
            
            // for each reverse iterator
            forEachReverse: function(fn) {
                
                var node = this.last(),
                    i = 0;
                
                while (node !== null) {
                    
                    fn(node.obj, i, node);
                    node = node.prev;
                    i += 1;
                }
            },
            
            // some iterator
            some: function(fn) {
                
                var node = this.first(),
                    val = false,
                    i = 0;
                
                while (node !== null && !val) {
                    
                    val = fn(node.obj, i, node);
                    node = node.next;
                    i += 1;
                }
            },
            
            // some reverse iterator
            someReverse: function(fn) {
                
                var node = this.last(),
                    val = false,
                    i = 0;
                
                while (node !== null && !val) {
                    
                    val = fn(node.obj, i, node);
                    node = node.prev;
                    i += 1;
                }
            },
            
            // every iterator
            every: function(fn) {
                
                var node = this.first(),
                    val = true,
                    i = 0;
                
                while (node !== null && val) {
                    
                    val = fn(node.obj, i, node);
                    node = node.next;
                    i += 1;
                }
            },
            
            // every reverse iterator
            everyReverse: function(fn) {
                
                var node = this.last(),
                    val = true,
                    i = 0;
                
                while (node !== null && val) {
                    
                    val = fn(node.obj, i, node);
                    node = node.prev;
                    i += 1;
                }
            },
            
            // map
            map: function(fn) {
                
                var node = this.first(),
                    out = [],
                    i = 0;
                
                while (node !== null) {
                    
                    out.push(fn(node.obj, i, node));
                    node = node.next;
                    i += 1;
                }
                
                return out;
            },
            
            // map reverse
            mapReverse: function(fn) {
                
                var node = this.last(),
                    out = [],
                    i = 0;
                
                while (node !== null) {
                    
                    out.push(fn(node.obj, i, node));
                    node = node.prev;
                    i += 1;
                }
                
                return out;
            },
            
            // filter
            filter: function(fn) {
                
                var node = this.first(),
                    out = [],
                    i = 0;
                
                while (node !== null) {
                    
                    if (fn(node.obj, i, node)) {
                        
                        out.push(node.obj);
                    }
                    
                    node = node.next;
                    i += 1;
                }
                
                return out;
            },
            
            // filter reverse
            filterReverse: function(fn) {
                
                var node = this.last(),
                    out = [],
                    i = 0;
                
                while (node !== null) {
                    
                    if (fn(node.obj, i, node)) {
                        
                        out.push(node.obj);
                    }
                    
                    node = node.prev;
                    i += 1;
                }
                
                return out;
            },
            
            // reduce
            reduce: function(fn, initial) {
                
                var node = this.first(),
                    out = initial,
                    i = 0;
                
                while (node !== null) {
                    
                    out = fn(node.obj, out, i, node);
                    node = node.next;
                    i += 1;
                }
                
                return out;
            },
            
            // reduce reverse
            reduceReverse: function(fn, initial) {
                
                var node = this.last(),
                    out = initial,
                    i = 0;
                
                while (node !== null) {
                    
                    out = fn(node.obj, out, i, node);
                    node = node.prev;
                    i += 1;
                }
                
                return out;
            },
            
            
            ///////////////////////////////////////////////////////////////////
            // internal methods
            ///////////////////////////////////////////////////////////////////
            
            // the first insert
            _firstInsert: function(obj) {
                
                var node = {
                    obj: obj,
                    prev: null,
                    next: null
                };
                
                this._tails = {
                    first: node,
                    last: node
                };
                
                this._count += 1;
                
                return node;
            },
            
            // empty the list
            _empty: function() {
                
                this._tails = null;
            }
        });
        
        
        // define the package structure
        base.DoublyLinkedList = DoublyLinkedList;
        return base.DoublyLinkedList;
    }
);