// planted: named colors inside style contexts still count, an off brand var() fallback counts, a plain calc offset counts
import styled, { css } from 'styled-components';
const Box = styled.div`
  color: red;
`;
const mixin = css`border-color: tomato;`;
export const A = () => <p style={{ background: 'navy' }} sx={{ color: 'orange' }}>x</p>;
export const B = () => <p style="color: purple; border-radius: calc(4px + 3px)">y</p>;
export const C = () => <p style={{ color: 'var(--ink, #3b82f6)' }}>z</p>;
