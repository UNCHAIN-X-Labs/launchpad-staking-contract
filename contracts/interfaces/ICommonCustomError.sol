// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.24;

interface ICommonCustomError {
    /**
     * @dev It was not executed within the valid period.
     * @param startBlock The starting block number.
     * @param endBlock The end block number.
     */
    error InvalidPeriod(uint256 startBlock, uint256 endBlock);

    /**
     * @dev The input value is not a valid range value.
     * @param first The first value in range.
     * @param last The last value in range.
     * @param input The input value.
     */
    error OutOfRange(uint256 first, uint256 last, uint256 input);

    /**
     * @dev The required value is exceeds the limit value.
     * @param limit The limit value.
     * @param required The required value.
     */
    error OverTheLimit(uint256 limit, uint256 required);

    /**
     * @dev Over the deadline. No more execute the function.
     * @param deadline The block number for deadline.
     */
    error OverTheDeadline(uint256 deadline);

    /**
     * @dev The starting block number has not yet been reached.
     * @param startingPoint The starting block number.
     */
    error NotYetStarted(uint256 startingPoint);

    /**
     * @dev The required value is below the standard value.
     * @param standard The standard value.
     * @param required The required value.
     */
    error BelowStandard(uint256 standard, uint256 required);
}