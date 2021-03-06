/**
 * @module ol/Collection
 */
import {inherits} from './index.js';
import AssertionError from './AssertionError.js';
import CollectionEventType from './CollectionEventType.js';
import BaseObject from './Object.js';
import Event from './events/Event.js';


/**
 * @enum {string}
 * @private
 */
var Property = {
  LENGTH: 'length'
};


/**
 * @typedef {{unique: (boolean|undefined)}}
 */
export var CollectionOptions;


/**
 * @classdesc
 * An expanded version of standard JS Array, adding convenience methods for
 * manipulation. Add and remove changes to the Collection trigger a Collection
 * event. Note that this does not cover changes to the objects _within_ the
 * Collection; they trigger events on the appropriate object, not on the
 * Collection as a whole.
 *
 * @constructor
 * @extends {ol.Object}
 * @fires ol.Collection.Event
 * @param {Array.<T>=} opt_array Array.
 * @param {CollectionOptions=} opt_options Collection options.
 * @param {boolean|undefined} opt_options.unique Disallow the same item from
 *     being added to the collection twice.  Default is false.
 * @template T
 * @api
 */
var _ol_Collection_ = function(opt_array, opt_options) {

  BaseObject.call(this);

  var options = opt_options || {};

  /**
   * @private
   * @type {boolean}
   */
  this.unique_ = !!options.unique;

  /**
   * @private
   * @type {!Array.<T>}
   */
  this.array_ = opt_array ? opt_array : [];

  if (this.unique_) {
    for (var i = 0, ii = this.array_.length; i < ii; ++i) {
      this.assertUnique_(this.array_[i], i);
    }
  }

  this.updateLength_();

};

inherits(_ol_Collection_, BaseObject);


/**
 * Remove all elements from the collection.
 * @api
 */
_ol_Collection_.prototype.clear = function() {
  while (this.getLength() > 0) {
    this.pop();
  }
};


/**
 * Add elements to the collection.  This pushes each item in the provided array
 * to the end of the collection.
 * @param {!Array.<T>} arr Array.
 * @return {ol.Collection.<T>} This collection.
 * @api
 */
_ol_Collection_.prototype.extend = function(arr) {
  var i, ii;
  for (i = 0, ii = arr.length; i < ii; ++i) {
    this.push(arr[i]);
  }
  return this;
};


/**
 * Iterate over each element, calling the provided callback.
 * @param {function(T, number, Array.<T>): *} f The function to call
 *     for every element. This function takes 3 arguments (the element, the
 *     index and the array). The return value is ignored.
 * @api
 */
_ol_Collection_.prototype.forEach = function(f) {
  var array = this.array_;
  for (var i = 0, ii = array.length; i < ii; ++i) {
    f(array[i], i, array);
  }
};


/**
 * Get a reference to the underlying Array object. Warning: if the array
 * is mutated, no events will be dispatched by the collection, and the
 * collection's "length" property won't be in sync with the actual length
 * of the array.
 * @return {!Array.<T>} Array.
 * @api
 */
_ol_Collection_.prototype.getArray = function() {
  return this.array_;
};


/**
 * Get the element at the provided index.
 * @param {number} index Index.
 * @return {T} Element.
 * @api
 */
_ol_Collection_.prototype.item = function(index) {
  return this.array_[index];
};


/**
 * Get the length of this collection.
 * @return {number} The length of the array.
 * @observable
 * @api
 */
_ol_Collection_.prototype.getLength = function() {
  return (/** @type {number} */ this.get(Property.LENGTH));
};


/**
 * Insert an element at the provided index.
 * @param {number} index Index.
 * @param {T} elem Element.
 * @api
 */
_ol_Collection_.prototype.insertAt = function(index, elem) {
  if (this.unique_) {
    this.assertUnique_(elem);
  }
  this.array_.splice(index, 0, elem);
  this.updateLength_();
  this.dispatchEvent(
      new _ol_Collection_.Event(CollectionEventType.ADD, elem));
};


/**
 * Remove the last element of the collection and return it.
 * Return `undefined` if the collection is empty.
 * @return {T|undefined} Element.
 * @api
 */
_ol_Collection_.prototype.pop = function() {
  return this.removeAt(this.getLength() - 1);
};


/**
 * Insert the provided element at the end of the collection.
 * @param {T} elem Element.
 * @return {number} New length of the collection.
 * @api
 */
_ol_Collection_.prototype.push = function(elem) {
  if (this.unique_) {
    this.assertUnique_(elem);
  }
  var n = this.getLength();
  this.insertAt(n, elem);
  return this.getLength();
};


/**
 * Remove the first occurrence of an element from the collection.
 * @param {T} elem Element.
 * @return {T|undefined} The removed element or undefined if none found.
 * @api
 */
_ol_Collection_.prototype.remove = function(elem) {
  var arr = this.array_;
  var i, ii;
  for (i = 0, ii = arr.length; i < ii; ++i) {
    if (arr[i] === elem) {
      return this.removeAt(i);
    }
  }
  return undefined;
};


/**
 * Remove the element at the provided index and return it.
 * Return `undefined` if the collection does not contain this index.
 * @param {number} index Index.
 * @return {T|undefined} Value.
 * @api
 */
_ol_Collection_.prototype.removeAt = function(index) {
  var prev = this.array_[index];
  this.array_.splice(index, 1);
  this.updateLength_();
  this.dispatchEvent(
      new _ol_Collection_.Event(CollectionEventType.REMOVE, prev));
  return prev;
};


/**
 * Set the element at the provided index.
 * @param {number} index Index.
 * @param {T} elem Element.
 * @api
 */
_ol_Collection_.prototype.setAt = function(index, elem) {
  var n = this.getLength();
  if (index < n) {
    if (this.unique_) {
      this.assertUnique_(elem, index);
    }
    var prev = this.array_[index];
    this.array_[index] = elem;
    this.dispatchEvent(
        new _ol_Collection_.Event(CollectionEventType.REMOVE, prev));
    this.dispatchEvent(
        new _ol_Collection_.Event(CollectionEventType.ADD, elem));
  } else {
    var j;
    for (j = n; j < index; ++j) {
      this.insertAt(j, undefined);
    }
    this.insertAt(index, elem);
  }
};


/**
 * @private
 */
_ol_Collection_.prototype.updateLength_ = function() {
  this.set(Property.LENGTH, this.array_.length);
};


/**
 * @private
 * @param {T} elem Element.
 * @param {number=} opt_except Optional index to ignore.
 */
_ol_Collection_.prototype.assertUnique_ = function(elem, opt_except) {
  for (var i = 0, ii = this.array_.length; i < ii; ++i) {
    if (this.array_[i] === elem && i !== opt_except) {
      throw new AssertionError(58);
    }
  }
};

/**
 * @classdesc
 * Events emitted by {@link ol.Collection} instances are instances of this
 * type.
 *
 * @constructor
 * @extends {ol.events.Event}
 * @implements {oli.Collection.Event}
 * @param {ol.CollectionEventType} type Type.
 * @param {*=} opt_element Element.
 */
_ol_Collection_.Event = function(type, opt_element) {

  Event.call(this, type);

  /**
   * The element that is added to or removed from the collection.
   * @type {*}
   * @api
   */
  this.element = opt_element;

};
inherits(_ol_Collection_.Event, Event);

export default _ol_Collection_;
